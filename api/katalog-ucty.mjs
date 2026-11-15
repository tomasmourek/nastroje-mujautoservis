// Samoobslužné přihlášení ke katalogu. Identita firmy nikdy nepochází z požadavku klienta.
import { DatabaseSync } from "node:sqlite";
import { randomBytes, createHash } from "node:crypto";
import { mkdir, chmod } from "node:fs/promises";
import { dirname } from "node:path";

const PREFIX = "/sestavy/api/ucet/";
const RELACE = "__Secure-ic-katalog-relace";
const PROHLIZEC = "__Secure-ic-katalog-prohlizec";
const ODKAZ_MS = 10 * 60_000;
const RELACE_MS = 30 * 24 * 3_600_000;
// Jediná adresa bez zobrazovaného jména a oddělovačů seznamu příjemců.
const PLATNY_EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
const otisk = (v) => createHash("sha256").update(v).digest("hex");
const nahoda = () => randomBytes(32).toString("base64url");
const platnyToken = (v) => typeof v === "string" && /^[A-Za-z0-9_-]{43}$/.test(v);
function cookie(req, jmeno) {
  const casti = String(req.headers.cookie ?? "").split(";").map(v => v.trim()).filter(v => v.startsWith(`${jmeno}=`));
  return casti.length === 1 ? casti[0].slice(jmeno.length + 1) : "";
}
const nastavCookie = (jmeno, hodnota, sekundy) => `${jmeno}=${hodnota}; Path=/sestavy/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${sekundy}`;
function json(res, status, data, cookies) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...(cookies ? { "Set-Cookie": cookies } : {}) });
  res.end(JSON.stringify(data));
}
async function telo(req) {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers["content-type"] ?? "")) throw new Error();
  const casti = []; let velikost = 0;
  for await (const cast of req) { velikost += cast.length; if (velikost > 8192) throw new Error(); casti.push(cast); }
  const data = JSON.parse(Buffer.concat(casti).toString("utf8"));
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
  return data;
}

/** Trvalé účty, jednorázové odkazy a relace: v DB jsou pouze otisky nosných tajemství. */
export async function otevritUcty({ cesta, ted = Date.now }) {
  await mkdir(dirname(cesta), { recursive: true, mode: 0o700 });
  await chmod(dirname(cesta), 0o700);
  const db = new DatabaseSync(cesta);
  try {
    await chmod(cesta, 0o600);
    db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA secure_delete=ON;
      CREATE TABLE IF NOT EXISTS ucty (email TEXT PRIMARY KEY, firma TEXT NOT NULL UNIQUE, vytvoreno INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS odkazy (token TEXT PRIMARY KEY, email TEXT NOT NULL, prohlizec TEXT NOT NULL, konec INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS relace (token TEXT PRIMARY KEY, email TEXT NOT NULL, konec INTEGER NOT NULL, vytvoreno INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS limity (klic TEXT PRIMARY KEY, konec INTEGER NOT NULL, pocet INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS odkazy_konec ON odkazy(konec);
      CREATE INDEX IF NOT EXISTS relace_konec ON relace(konec);`);
  } catch (e) { db.close(); throw e; }
  let zavreno = false;
  const transakce = fn => {
    db.exec("BEGIN IMMEDIATE");
    try { const v = fn(); db.exec("COMMIT"); return v; } catch (e) { db.exec("ROLLBACK"); throw e; }
  };
  const uklid = () => {
    db.prepare("DELETE FROM odkazy WHERE konec<=?").run(ted());
    db.prepare("DELETE FROM relace WHERE konec<=?").run(ted());
    db.prepare("DELETE FROM limity WHERE konec<=?").run(ted());
  };
  function limit(klice) {
    return transakce(() => {
      uklid();
      // Pevné limity brání růstu DB i při mnoha náhodných adresách a IP.
      if (db.prepare("SELECT count(*) AS n FROM limity").get().n >= 10_000) return false;
      for (const [klic, maximum] of klice) {
        const r = db.prepare("SELECT pocet FROM limity WHERE klic=?").get(klic);
        if (r && r.pocet >= maximum) return false;
      }
      for (const [klic] of klice) db.prepare(`INSERT INTO limity(klic,konec,pocet) VALUES (?,?,1)
        ON CONFLICT(klic) DO UPDATE SET pocet=pocet+1`).run(klic, ted() + 3_600_000);
      return true;
    });
  }
  function odkaz(email, prohlizec) {
    return transakce(() => {
      uklid();
      db.prepare("DELETE FROM odkazy WHERE email=?").run(email);
      const token = nahoda();
      db.prepare("INSERT INTO odkazy VALUES (?,?,?,?)").run(otisk(token), email, otisk(prohlizec), ted() + ODKAZ_MS);
      return token;
    });
  }
  function potvrdit(token, prohlizec, soucasnaRelace) {
    if (!platnyToken(token) || !platnyToken(prohlizec)) return null;
    return transakce(() => {
      uklid();
      const r = db.prepare("SELECT * FROM odkazy WHERE token=? AND prohlizec=? AND konec>?").get(otisk(token), otisk(prohlizec), ted());
      if (!r) return null;
      db.prepare("DELETE FROM odkazy WHERE token=?").run(otisk(token));
      db.prepare("INSERT OR IGNORE INTO ucty VALUES (?,?,?)").run(r.email, `email-${randomBytes(16).toString("hex")}`, ted());
      const ucet = db.prepare("SELECT email,firma FROM ucty WHERE email=?").get(r.email);
      if (platnyToken(soucasnaRelace)) db.prepare("DELETE FROM relace WHERE token=?").run(otisk(soucasnaRelace));
      // Nejvýše pět souběžných zařízení na účet. Při novém přihlášení se relace vždy otočí.
      db.prepare(`DELETE FROM relace WHERE email=? AND token IN
        (SELECT token FROM relace WHERE email=? ORDER BY vytvoreno DESC, rowid DESC LIMIT -1 OFFSET 4)`).run(r.email, r.email);
      const novaRelace = nahoda();
      db.prepare("INSERT INTO relace VALUES (?,?,?,?)").run(otisk(novaRelace), r.email, ted() + RELACE_MS, ted());
      return { ...ucet, token: novaRelace };
    });
  }
  function relace(token) {
    if (!platnyToken(token)) return null;
    return db.prepare(`SELECT u.email,u.firma FROM relace r JOIN ucty u ON u.email=r.email
      WHERE r.token=? AND r.konec>?`).get(otisk(token), ted()) ?? null;
  }
  return {
    firmy: () => new Set(db.prepare("SELECT firma FROM ucty").all().map(r => r.firma)),
    limit, odkaz, potvrdit, relace, uklid,
    zrusitOdkaz: token => { if (platnyToken(token)) db.prepare("DELETE FROM odkazy WHERE token=?").run(otisk(token)); },
    odhlasit: token => { if (platnyToken(token)) db.prepare("DELETE FROM relace WHERE token=?").run(otisk(token)); },
    zavrit: () => { if (!zavreno) { zavreno = true; db.close(); } },
  };
}

export function vytvoritUcetApi({ ucty, odeslat, origin = "https://nastroje.mujautoservis.eu", povolitFirmu = () => {} }) {
  const pripraveno = !!ucty && typeof odeslat === "function";
  const identita = req => ucty?.relace(cookie(req, RELACE)) ?? null;
  const stav = req => {
    const ucet = identita(req);
    return { pripraveno, prihlasen: !!ucet, ...(ucet ? { email: ucet.email, ucet: ucet.firma } : {}) };
  };
  const api = async (req, res) => {
    const cesta = (req.url ?? "").split("?")[0];
    if (!cesta.startsWith(PREFIX)) return false;
    const odpoved = (status, data, cookies) => { json(res, status, data, cookies); return true; };
    const chyba = (status, zprava) => odpoved(status, { chyba: zprava });
    try {
      if (req.headers.origin && req.headers.origin !== origin || req.headers["sec-fetch-site"] === "cross-site")
        return chyba(403, "Nepovolený původ požadavku.");
      if (cesta === `${PREFIX}stav` && req.method === "GET") return odpoved(200, stav(req));
      if (![`${PREFIX}odkaz`, `${PREFIX}potvrdit`, `${PREFIX}odhlasit`].includes(cesta)) return chyba(404, "Nenalezeno.");
      if (req.method !== "POST") return chyba(405, "Nepovolená metoda.");
      if (req.headers.origin !== origin) return chyba(403, "Nepovolený původ požadavku.");
      if (!ucty || cesta !== `${PREFIX}odhlasit` && !pripraveno)
        return chyba(503, "Přihlášení e-mailem zatím není dostupné. Zkuste to později nebo použijte dosavadní firemní kód.");
      let data;
      try { data = await telo(req); } catch { return chyba(400, "Neplatný nebo příliš velký požadavek."); }
      const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "").split(",").at(-1).trim();
      if (cesta.endsWith("/odkaz")) {
        const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
        if (Object.keys(data).length !== 1 || !PLATNY_EMAIL.test(email) || email.length > 254)
          return chyba(400, "Vyplňte platnou e-mailovou adresu.");
        if (!ucty.limit([[`odkaz-ip:${otisk(ip)}`, 10], [`odkaz-email:${otisk(email)}`, 3], ["odkaz-celkem", 100]]))
          return chyba(429, "Příliš mnoho žádostí o přihlášení. Zkuste to za hodinu.");
        const staryProhlizec = cookie(req, PROHLIZEC);
        const prohlizec = platnyToken(staryProhlizec) ? staryProhlizec : nahoda();
        const token = ucty.odkaz(email, prohlizec);
        try {
          await odeslat({ to: email, subject: "Přihlášení ke skladovému katalogu – Účetní sestavy",
            text: `Pro přihlášení ke skladovému katalogu otevřete tento odkaz ve stejném prohlížeči, ve kterém jste o něj požádali:\n\n${origin}/sestavy/#prihlaseni=${token}\n\nOdkaz platí 10 minut a lze jej použít pouze jednou. Přihlášení poté potvrďte na stránce. Pokud jste o přihlášení nežádali, tento e-mail ignorujte.\n` });
        } catch {
          ucty.zrusitOdkaz(token);
          return chyba(503, "Přihlašovací e-mail se nepodařilo odeslat. Zkuste to později.");
        }
        return odpoved(200, { odeslano: true }, [nastavCookie(PROHLIZEC, prohlizec, ODKAZ_MS / 1000)]);
      }
      if (cesta.endsWith("/potvrdit")) {
        if (Object.keys(data).length !== 1 || !platnyToken(data.token)) return chyba(400, "Neplatný přihlašovací odkaz.");
        if (!ucty.limit([[`potvrdit:${otisk(ip)}`, 30]])) return chyba(429, "Příliš mnoho pokusů o přihlášení. Zkuste to za hodinu.");
        const ucet = ucty.potvrdit(data.token, cookie(req, PROHLIZEC), cookie(req, RELACE));
        if (!ucet) return chyba(401, "Odkaz vypršel, byl použit nebo patří jinému prohlížeči. Požádejte zde o nový odkaz.");
        povolitFirmu(ucet.firma);
        return odpoved(200, { pripraveno, prihlasen: true, email: ucet.email, ucet: ucet.firma }, [nastavCookie(RELACE, ucet.token, RELACE_MS / 1000), nastavCookie(PROHLIZEC, "", 0)]);
      }
      if (Object.keys(data).length) return chyba(400, "Neplatný požadavek.");
      const soucasny = identita(req);
      if (soucasny && req.headers["x-katalog-ucet"] !== soucasny.firma) return chyba(401, "Přihlášený účet se změnil. Obnovte přihlášení.");
      ucty.odhlasit(cookie(req, RELACE));
      return odpoved(200, { pripraveno, prihlasen: false }, [nastavCookie(RELACE, "", 0), nastavCookie(PROHLIZEC, "", 0)]);
    } catch { return chyba(503, "Přihlášení není nyní dostupné. Zkuste to později."); }
  };
  return { obsluha: api, firma: req => {
    const ucet = identita(req);
    // ID z UI slouží jen k detekci změny cookie v jiné kartě. Firmu vybírá výhradně relace.
    return ucet && req.headers["x-katalog-ucet"] === ucet.firma ? ucet.firma : undefined;
  } };
}
