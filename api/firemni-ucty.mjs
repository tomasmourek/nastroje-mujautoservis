import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

const TYDEN = 7 * 24 * 3_600_000;
const ID_FIRMY = /^email-[a-f0-9]{32}$/;
const PRILOHY = ["pdf", "xlsx", "pohoda", "money", "isdoc", "kh", "skladoveDoklady"];
const POLE_FIRMY = ["nazev", "ulice", "cisloPopisne", "obec", "psc", "ico", "dic",
  "ufo", "pracufo", "email", "telefon", "sestavil", "cisloUctu", "kodBanky"];
const TEXTY = ["predkontaceFaktur", "predkontacePokladny", "zkratkaPokladny", "cleniDph"];
const objekt = v => v !== null && typeof v === "object" && !Array.isArray(v);
const maPole = (v, pole) => objekt(v) && Object.keys(v).length === pole.length
  && pole.every(k => Object.hasOwn(v, k));
const text = (v, max = 160) => typeof v === "string" && v.length <= max && !Array.from(v).some(znak => znak < " ");
const castka = v => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1e12;

export function vytvoritFiremniUloziste({ db, transakce, klic, ted }) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS firemni_nastaveni (
      firma TEXT PRIMARY KEY, revize INTEGER NOT NULL, obsah BLOB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS firemni_pristupy (
      firma TEXT NOT NULL, email TEXT NOT NULL, vyprsi INTEGER NOT NULL,
      prijato INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (firma, email)
    );
    CREATE INDEX IF NOT EXISTS firemni_pristupy_email ON firemni_pristupy(email);
  `);
  const sifra = Buffer.from(hkdfSync("sha256", klic, "", "ic-office-firemni-nastaveni-v1", 32));
  const nastaveni = db.prepare("SELECT revize, obsah FROM firemni_nastaveni WHERE firma=?");
  const vlastnik = db.prepare("SELECT email FROM ucty WHERE firma=?");
  const pristup = db.prepare("SELECT prijato, vyprsi FROM firemni_pristupy WHERE firma=? AND email=?");
  const kontext = (firma, revize) => Buffer.from(`${firma}:${revize}`);

  function cist(firma) {
    const r = nastaveni.get(firma);
    if (!r) return { revize: 0, nastaveni: null };
    const obsah = Buffer.from(r.obsah);
    const d = createDecipheriv("aes-256-gcm", sifra, obsah.subarray(0, 12));
    d.setAAD(kontext(firma, r.revize));
    d.setAuthTag(obsah.subarray(12, 28));
    return { revize: r.revize, nastaveni: JSON.parse(Buffer.concat([d.update(obsah.subarray(28)), d.final()]).toString("utf8")) };
  }

  const popis = (firma, email, spravce) => ({ firma, nazev: cist(firma).nastaveni?.firma.nazev.trim() || email, spravce });
  return {
    uklid: () => db.prepare("DELETE FROM firemni_pristupy WHERE prijato=0 AND vyprsi<=?").run(ted()),
    zavrit: () => sifra.fill(0),
    seznam(ucet) {
      const hostovani = db.prepare(`SELECT p.firma, p.prijato, u.email FROM firemni_pristupy p
        JOIN ucty u ON u.firma=p.firma WHERE p.email=? AND (p.prijato=1 OR p.vyprsi>?)
        ORDER BY p.firma`).all(ucet.email, ted());
      const pristupy = db.prepare(`SELECT email, prijato FROM firemni_pristupy
        WHERE firma=? AND (prijato=1 OR vyprsi>?) ORDER BY email`).all(ucet.firma, ted());
      return {
        firmy: [popis(ucet.firma, ucet.email, true),
          ...hostovani.filter(r => r.prijato).map(r => popis(r.firma, r.email, false))],
        pozvanky: hostovani.filter(r => !r.prijato).map(r => popis(r.firma, r.email, false)),
        pristupy: pristupy.map(r => ({ email: r.email, prijato: !!r.prijato })),
      };
    },
    cist(ucet, firma) {
      if (firma !== ucet.firma && (!pristup.get(firma, ucet.email)?.prijato || !vlastnik.get(firma))) return null;
      return cist(firma);
    },
    ulozit(firma, revize, hodnoty) {
      return transakce(() => {
        if ((nastaveni.get(firma)?.revize ?? 0) !== revize) return null;
        const iv = randomBytes(12);
        const c = createCipheriv("aes-256-gcm", sifra, iv);
        const novaRevize = revize + 1;
        c.setAAD(kontext(firma, novaRevize));
        const zasifrovane = Buffer.concat([c.update(JSON.stringify(hodnoty), "utf8"), c.final()]);
        db.prepare(`INSERT INTO firemni_nastaveni VALUES (?,?,?)
          ON CONFLICT(firma) DO UPDATE SET revize=excluded.revize, obsah=excluded.obsah`)
          .run(firma, novaRevize, Buffer.concat([iv, c.getAuthTag(), zasifrovane]));
        return novaRevize;
      });
    },
    pozvat(firma, email) {
      return transakce(() => {
        const cas = ted();
        const r = pristup.get(firma, email);
        if (r && (r.prijato || r.vyprsi > cas)) return "existuje";
        const { n } = db.prepare(`SELECT count(*) AS n FROM firemni_pristupy
          WHERE firma=? AND (prijato=1 OR vyprsi>?)`).get(firma, cas);
        if (n >= 50) return "plno";
        db.prepare(`INSERT INTO firemni_pristupy (firma,email,vyprsi) VALUES (?,?,?)
          ON CONFLICT(firma,email) DO UPDATE SET vyprsi=excluded.vyprsi`).run(firma, email, cas + TYDEN);
        return "pridano";
      });
    },
    prijmout(firma, email) {
      if (!vlastnik.get(firma)) return false;
      return db.prepare(`UPDATE firemni_pristupy SET prijato=1, vyprsi=0
        WHERE firma=? AND email=? AND vyprsi>?`).run(firma, email, ted()).changes === 1
        || pristup.get(firma, email)?.prijato === 1;
    },
    odebrat(firma, email) {
      db.prepare("DELETE FROM firemni_pristupy WHERE firma=? AND email=?").run(firma, email);
    },
  };
}

function platneNastaveni(n, email) {
  if (!maPole(n, ["firma", "sklady", "pocatecniZustatekPokladny", "datumTrzeb",
    "zahrnoutPokladnuDoTrzeb", ...TEXTY, "vychoziObdobi", "ucetniProgram", "odeslani"])) return false;
  if (!maPole(n.firma, POLE_FIRMY) || !Object.values(n.firma).every(v => text(v, 254))
    || !TEXTY.every(k => text(n[k])) || !castka(n.pocatecniZustatekPokladny)
    || typeof n.zahrnoutPokladnuDoTrzeb !== "boolean" || !["duzp", "vystaveni"].includes(n.datumTrzeb)
    || !["den", "mesic"].includes(n.vychoziObdobi) || !["pohoda", "money", "jiny"].includes(n.ucetniProgram)) return false;
  if (!objekt(n.sklady) || Object.keys(n.sklady).length > 120
    || !Object.entries(n.sklady).every(([k, v]) => k && text(k) && !Object.hasOwn(Object.prototype, k)
      && k !== "prototype" && maPole(v, ["ucet", "pocatecniStav", "vyloucen"])
      && text(v.ucet) && castka(v.pocatecniStav) && typeof v.vyloucen === "boolean")) return false;
  const o = n.odeslani;
  return maPole(o, ["komu", "prilohy"]) && text(o.komu, 1600)
    && o.komu.split(/[\s,;]+/).filter(Boolean).every(adresa => email(adresa))
    && Array.isArray(o.prilohy) && o.prilohy.length <= PRILOHY.length && o.prilohy.every(id => PRILOHY.includes(id));
}

export function vytvoritFiremniApi({ ucty, odeslat, origin, potrebaUctu, telo, json, email, otisk }) {
  const prefix = "/sestavy/api/ucet/firmy";
  return async (req, res, cesta) => {
    const odpoved = (stav, data) => { json(res, stav, data); return true; };
    const chyba = stav => odpoved(stav, {});
    const ucet = potrebaUctu(req);
    if (!ucet) return chyba(401);
    const firmy = ucty?.firemni;
    if (!firmy) return chyba(503);
    const akce = cesta.slice(prefix.length);
    if (req.method === "GET") {
      if (akce === "") return odpoved(200, firmy.seznam(ucet));
      if (akce !== "/nastaveni") return chyba(404);
      const firma = new URL(req.url, origin).searchParams.get("firma");
      const ulozene = ID_FIRMY.test(firma ?? "") && firmy.cist(ucet, firma);
      return ulozene ? odpoved(200, ulozene) : chyba(403);
    }
    if (req.method !== "POST") return chyba(405);
    if (req.headers.origin !== origin) return chyba(403);
    let data;
    try { data = await telo(req, akce === "/nastaveni" ? 32_768 : 8192); }
    catch { return chyba(400); }
    if (!potrebaUctu(req)) return chyba(401);
    if (akce === "/nastaveni") {
      if (!maPole(data, ["firma", "revize", "nastaveni"]) || typeof data.firma !== "string" || !ID_FIRMY.test(data.firma)
        || !Number.isSafeInteger(data.revize) || data.revize < 0
        || !platneNastaveni(data.nastaveni, email)) return chyba(400);
      if (data.firma !== ucet.firma) return chyba(403);
      const revize = firmy.ulozit(ucet.firma, data.revize, data.nastaveni);
      return revize === null ? chyba(409) : odpoved(200, { revize });
    }
    if (akce === "/prijmout") {
      if (!maPole(data, ["firma"]) || typeof data.firma !== "string" || !ID_FIRMY.test(data.firma)) return chyba(400);
      return firmy.prijmout(data.firma, ucet.email) ? odpoved(200, {}) : chyba(403);
    }
    if (!["/pozvat", "/odebrat"].includes(akce)) return chyba(404);
    const adresa = email(data.email);
    if (!maPole(data, ["email"]) || !adresa || adresa === ucet.email) return chyba(400);
    if (akce === "/odebrat") {
      firmy.odebrat(ucet.firma, adresa);
      return odpoved(200, {});
    }
    if (typeof odeslat !== "function") return chyba(503);
    if (!ucty.limit([[`pozvanka:${otisk(ucet.email)}`, 10], ["pozvanky-celkem", 100]])) return chyba(429);
    const stav = firmy.pozvat(ucet.firma, adresa);
    if (stav === "plno") return chyba(409);
    if (stav === "existuje") return odpoved(200, { stav });
    try {
      await odeslat({ to: adresa, subject: "Pozvánka do Účetních sestav",
        text: `Uživatel ${ucet.email} vás pozval do firmy v Účetních sestavách.\n\nPřihlaste se adresou ${adresa} a pozvánku potvrďte v Nastavení:\n${origin}/sestavy/#nastaveni\n\nPozvánka je dostupná 7 dní. Pokud pozvánku nečekáte, tento e-mail ignorujte.\n` });
    } catch {
      // Doručení může být nejisté. Pozvánka je dostupná po přihlášení a druhý e-mail neposíláme automaticky.
      return odpoved(200, { stav: "ceka-bez-potvrzeni" });
    }
    return odpoved(200, { stav });
  };
}
