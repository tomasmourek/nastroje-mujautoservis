// Trvalý plánovač katalogu. Identitu firmy dodává výhradně autorizovaná obsluha API.
import { DatabaseSync } from "node:sqlite";
import { mkdir, chmod } from "node:fs/promises";
import { dirname } from "node:path";
import { randomBytes, randomUUID, createCipheriv, createDecipheriv, createHash } from "node:crypto";
import { ChybaKatalogu, zpravaChybyKatalogu, krokChybyKatalogu } from "./katalog-chyby.mjs";

const LEASE = 120_000;
const TIMEOUT = 90_000;
const RETRY = 300_000;
const MAX_POKUSU = 3;
const ZPRAVY = {
  FIRMA: "Firma nemá přístup ke katalogu.",
  PLAN: "Neplatné nastavení plánu.",
  NEPRIPOJENO: "Nejprve připojte IC Office.",
  OBSAZENO: "Stahování této firmy již probíhá.",
  UCET: "Účet již patří jinému připojení. Nejprve odpojte současný účet.",
  PRIPOJENI: "Připojení k IC Office se nezdařilo. Zkontrolujte připojení a zkuste to znovu.",
  ULOZISTE: "Úložiště katalogu není dostupné.",
};
const CHYBA_BEHU = "Katalog se nepodařilo stáhnout. Předchozí úspěšný export zůstal zachován.";

export class ChybaPlanovace extends Error {
  constructor(kod, krok) { super(zpravaChybyKatalogu(kod) ?? ZPRAVY[kod] ?? ZPRAVY.ULOZISTE); this.name = "ChybaPlanovace"; this.kod = kod; this.krok = krokChybyKatalogu(krok); }
}

function sifrovat(klic, firma, hodnota) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", klic, iv);
  cipher.setAAD(Buffer.from(firma));
  const obsah = Buffer.concat([cipher.update(hodnota, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), obsah]);
}
function desifrovat(klic, firma, hodnota) {
  const data = Buffer.from(hodnota);
  const cipher = createDecipheriv("aes-256-gcm", klic, data.subarray(0, 12));
  cipher.setAAD(Buffer.from(firma));
  cipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([cipher.update(data.subarray(28)), cipher.final()]).toString("utf8");
}
function overitSnimek(v) {
  if (!v || typeof v.xml !== "string" || !v.xml.startsWith("<?xml") || Buffer.byteLength(v.xml) > 100 * 1024 * 1024
    || !Buffer.isBuffer(v.xlsx) || v.xlsx.length > 50 * 1024 * 1024
    || !Number.isSafeInteger(v.polozky) || v.polozky < 0 || !Number.isSafeInteger(v.sklady) || v.sklady < 0)
    throw new ChybaPlanovace("PRIPOJENI");
  return { xml: Buffer.from(v.xml), xlsx: v.xlsx, polozky: v.polozky, sklady: v.sklady };
}

/** Node 24+, privátní cesta na trvalém svazku a 32bajtový provozní klíč. */
export async function otevritPlanovac({ cesta, klic, firmy, platnyPlan, pristiTermin, stahnout, ted = () => Date.now() }) {
  if (!Buffer.isBuffer(klic) || klic.length !== 32 || !(firmy instanceof Set)
    || [...firmy].some((f) => typeof f !== "string" || !/^[a-z0-9-]{1,40}$/.test(f))
    || typeof platnyPlan !== "function" || typeof pristiTermin !== "function" || typeof stahnout !== "function")
    throw new ChybaPlanovace("ULOZISTE");
  // Kopie brání změně konfigurace a klíče volajícím během otevřené služby.
  klic = Buffer.from(klic); firmy = new Set(firmy);
  let db;
  try {
    await mkdir(dirname(cesta), { recursive: true, mode: 0o700 });
    await chmod(dirname(cesta), 0o700);
    db = new DatabaseSync(cesta);
    await chmod(cesta, 0o600);
    db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA secure_delete=ON;
      CREATE TABLE IF NOT EXISTS metadata (klic TEXT PRIMARY KEY, hodnota BLOB NOT NULL);
      CREATE TABLE IF NOT EXISTS firmy (
        firma TEXT PRIMARY KEY, rev TEXT NOT NULL, ucet TEXT UNIQUE, prihlaseni BLOB, plan TEXT, dalsi INTEGER,
        uspech INTEGER, chyba TEXT, xml BLOB, xlsx BLOB, polozky INTEGER, sklady INTEGER,
        lease_token TEXT, lease_do INTEGER
      );
      CREATE TABLE IF NOT EXISTS behy (
        firma TEXT NOT NULL REFERENCES firmy(firma) ON DELETE CASCADE, termin INTEGER NOT NULL,
        rev TEXT NOT NULL, pokusy INTEGER NOT NULL, stav TEXT NOT NULL, opakovat INTEGER,
        token TEXT, PRIMARY KEY(firma, termin)
      );`);
    const kontrola = db.prepare("SELECT hodnota FROM metadata WHERE klic='sifra'").get();
    if (kontrola) {
      if (desifrovat(klic, "katalog-klic-v1", kontrola.hodnota) !== "katalog-v1") throw new Error();
    } else db.prepare("INSERT INTO metadata VALUES ('sifra', ?)").run(sifrovat(klic, "katalog-klic-v1", "katalog-v1"));
    // Odebraný přístup smaže i uložená tajemství a poslední výsledky firmy.
    for (const { firma } of db.prepare("SELECT firma FROM firmy").all()) {
      if (!firmy.has(firma)) db.prepare("DELETE FROM firmy WHERE firma=?").run(firma);
    }
  } catch {
    try { db?.close(); } catch { /* Úložiště se nemuselo otevřít. */ }
    klic.fill(0);
    throw new ChybaPlanovace("ULOZISTE");
  }

  let konci = false;
  const aktivni = new Map();
  const transakce = (fn) => {
    db.exec("BEGIN IMMEDIATE");
    try { const r = fn(); db.exec("COMMIT"); return r; }
    catch (e) { db.exec("ROLLBACK"); throw e; }
  };
  const firmaPovolena = (firma) => {
    if (konci) throw new ChybaPlanovace("ULOZISTE");
    if (typeof firma !== "string" || !firmy.has(firma)) throw new ChybaPlanovace("FIRMA");
  };
  const radek = (firma) => db.prepare("SELECT * FROM firmy WHERE firma=?").get(firma);
  const zalozit = (firma) => db.prepare("INSERT OR IGNORE INTO firmy(firma,rev) VALUES (?,?)").run(firma, randomUUID());
  const dalsi = (plan) => {
    const t = pristiTermin(plan, new Date(ted())).getTime();
    if (!Number.isFinite(t) || t <= ted()) throw new ChybaPlanovace("PLAN");
    return t;
  };
  const promazat = (firma) => db.prepare(`DELETE FROM behy WHERE firma=? AND termin IN
    (SELECT termin FROM behy WHERE firma=? ORDER BY termin DESC LIMIT -1 OFFSET 100)`).run(firma, firma);
  const uvolnit = (firma, token) => db.prepare("UPDATE firmy SET lease_token=NULL,lease_do=NULL WHERE firma=? AND lease_token=?").run(firma, token);

  // Promise.race zaručuje uvolnění běhu i při adaptéru, který ignoruje AbortSignal.
  // Fencing token odmítne jakýkoli opožděný výsledek po vypršení lease/restartu.
  function stazeni(firma, prihlaseni) {
    const controller = new AbortController();
    let timer;
    const stop = new Promise((_, reject) => {
      controller.signal.addEventListener("abort", () => reject(new ChybaPlanovace("PRIPOJENI")), { once: true });
      timer = setTimeout(() => controller.abort(), TIMEOUT);
      timer.unref?.();
    });
    const promise = Promise.race([
      Promise.resolve().then(() => stahnout({ firma, prihlaseni, signal: controller.signal })).then(overitSnimek), stop,
    ]).finally(() => { clearTimeout(timer); aktivni.delete(promise); });
    aktivni.set(promise, { firma, controller });
    return promise;
  }

  function stav(firma) {
    firmaPovolena(firma);
    const r = radek(firma);
    const beh = r?.dalsi != null ? db.prepare("SELECT * FROM behy WHERE firma=? AND termin=?").get(firma, r.dalsi) : null;
    const termin = beh?.stav === "retry" ? beh.opakovat : r?.dalsi;
    return {
      pripojeno: !!r?.prihlaseni, email: r?.prihlaseni ? JSON.parse(desifrovat(klic, firma, r.prihlaseni)).email : null, plan: r?.plan ? JSON.parse(r.plan) : null,
      pristiTermin: termin != null ? new Date(termin).toISOString() : null,
      posledniUspech: r?.uspech != null ? new Date(r.uspech).toISOString() : null,
      chyba: r?.chyba ?? null, polozky: r?.polozky ?? null, sklady: r?.sklady ?? null,
      bezi: !!r?.lease_token && r.lease_do > ted(),
    };
  }

  async function pripojit(firma, prihlaseni) {
    firmaPovolena(firma);
    const email = typeof prihlaseni?.email === "string" ? prihlaseni.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new ChybaPlanovace("PRIPOJENI");
    prihlaseni = { ...prihlaseni, email };
    const ucet = createHash("sha256").update(email).digest("hex");
    const overitUcet = (r) => {
      const jiny = db.prepare("SELECT firma FROM firmy WHERE ucet=? AND firma<>?").get(ucet, firma);
      if (jiny || (r.ucet && r.ucet !== ucet)) throw new ChybaPlanovace("UCET");
    };
    let text;
    try { text = JSON.stringify(prihlaseni); if (!text || text.length > 16_384) throw new Error(); }
    catch { throw new ChybaPlanovace("PRIPOJENI"); }
    const token = randomUUID();
    const pred = transakce(() => {
      zalozit(firma);
      const r = radek(firma);
      // Cizí vazbu zkoumáme až po úspěšném přihlášení. Jinak by chybné
      // heslo umožnilo zjišťovat, které cizí e-maily službu používají.
      if (r.ucet && r.ucet !== ucet) throw new ChybaPlanovace("UCET");
      if (r.lease_token && r.lease_do > ted()) throw new ChybaPlanovace("OBSAZENO");
      db.prepare("UPDATE firmy SET lease_token=?,lease_do=? WHERE firma=?").run(token, ted() + LEASE, firma);
      return r;
    });
    try {
      const s = await stazeni(firma, JSON.parse(text));
      firmaPovolena(firma);
      transakce(() => {
        const r = radek(firma);
        if (!r || r.rev !== pred.rev || r.lease_token !== token) throw new ChybaPlanovace("OBSAZENO");
        overitUcet(r);
        db.prepare(`UPDATE firmy SET rev=?,ucet=?,prihlaseni=?,xml=?,xlsx=?,polozky=?,sklady=?,uspech=?,chyba=NULL,
          dalsi=?,lease_token=NULL,lease_do=NULL WHERE firma=?`).run(randomUUID(), ucet, sifrovat(klic, firma, text), s.xml, s.xlsx,
            s.polozky, s.sklady, ted(), r.plan ? dalsi(JSON.parse(r.plan)) : null, firma);
      });
      return stav(firma);
    } catch (e) {
      if (!konci) uvolnit(firma, token);
      throw e instanceof ChybaPlanovace ? e : new ChybaPlanovace(e instanceof ChybaKatalogu ? e.code : "PRIPOJENI", e instanceof ChybaKatalogu ? e.krok : null);
    }
  }

  function nastavitPlan(firma, plan) {
    firmaPovolena(firma);
    if (plan !== null && !platnyPlan(plan)) throw new ChybaPlanovace("PLAN");
    return transakce(() => {
      zalozit(firma);
      const r = radek(firma);
      if (plan !== null && !r.prihlaseni) throw new ChybaPlanovace("NEPRIPOJENO");
      // Zachovat lease starého adaptéru, ale revizí zneplatnit jeho výsledek.
      db.prepare("UPDATE firmy SET rev=?,plan=?,dalsi=?,chyba=NULL WHERE firma=?")
        .run(randomUUID(), plan === null ? null : JSON.stringify(plan), plan === null ? null : dalsi(plan), firma);
      return stav(firma);
    });
  }

  function odpojit(firma) {
    firmaPovolena(firma);
    transakce(() => {
      // Řádek se zámkem zůstává do ukončení případného již běžícího požadavku.
      db.prepare(`UPDATE firmy SET rev=?,ucet=NULL,prihlaseni=NULL,plan=NULL,dalsi=NULL,uspech=NULL,chyba=NULL,
        xml=NULL,xlsx=NULL,polozky=NULL,sklady=NULL WHERE firma=?`).run(randomUUID(), firma);
      db.prepare("DELETE FROM behy WHERE firma=?").run(firma);
    });
    for (const beh of aktivni.values()) if (beh.firma === firma) beh.controller.abort();
    return stav(firma);
  }

  function vysledek(firma, typ = "xml") {
    firmaPovolena(firma);
    if (!["xml", "xlsx"].includes(typ)) throw new ChybaPlanovace("PLAN");
    const r = radek(firma);
    return r?.[typ] == null ? null : Buffer.from(r[typ]);
  }

  function vyzvednout(firma) {
    return transakce(() => {
      const r = radek(firma);
      if (!r?.prihlaseni || !r.plan || r.dalsi > ted() || r.dalsi == null || (r.lease_token && r.lease_do > ted())) return null;
      let beh = db.prepare("SELECT * FROM behy WHERE firma=? AND termin=?").get(firma, r.dalsi);
      if (!beh) {
        db.prepare("INSERT INTO behy(firma,termin,rev,pokusy,stav,opakovat) VALUES (?,?,?,0,'retry',?)").run(firma, r.dalsi, r.rev, ted());
        beh = db.prepare("SELECT * FROM behy WHERE firma=? AND termin=?").get(firma, r.dalsi);
      }
      if (beh.rev !== r.rev || ["ok", "failed", "cancelled"].includes(beh.stav) || beh.pokusy >= MAX_POKUSU) {
        db.prepare("UPDATE firmy SET dalsi=?,chyba=? WHERE firma=?").run(dalsi(JSON.parse(r.plan)), CHYBA_BEHU, firma);
        db.prepare("UPDATE behy SET stav='failed' WHERE firma=? AND termin=? AND stav<>'ok'").run(firma, r.dalsi);
        return null;
      }
      if (beh.stav === "retry" && beh.opakovat > ted()) return null;
      const token = randomUUID();
      db.prepare("UPDATE firmy SET lease_token=?,lease_do=? WHERE firma=?").run(token, ted() + LEASE, firma);
      db.prepare("UPDATE behy SET stav='running',pokusy=pokusy+1,token=? WHERE firma=? AND termin=?").run(token, firma, r.dalsi);
      promazat(firma);
      return { ...r, token, pokusy: beh.pokusy + 1 };
    });
  }

  async function tick() {
    if (konci) return;
    for (const firma of firmy) {
      if (konci) return;
      const beh = vyzvednout(firma);
      if (!beh) continue;
      let snimek;
      try { snimek = await stazeni(firma, JSON.parse(desifrovat(klic, firma, beh.prihlaseni))); }
      catch { /* Do DB patří jen bezpečné sdělení, nikdy chyba adaptéru. */ }
      if (konci) return; // Lease obnoví další proces; výsledek vypínaného procesu nepublikujeme.
      transakce(() => {
        const r = radek(firma);
        if (!r || r.rev !== beh.rev || r.lease_token !== beh.token || r.dalsi !== beh.dalsi) {
          db.prepare("UPDATE behy SET stav='cancelled' WHERE firma=? AND termin=? AND token=?").run(firma, beh.dalsi, beh.token);
          uvolnit(firma, beh.token);
          return;
        }
        if (snimek) {
          db.prepare(`UPDATE firmy SET xml=?,xlsx=?,polozky=?,sklady=?,uspech=?,chyba=NULL,dalsi=?,lease_token=NULL,lease_do=NULL WHERE firma=?`)
            .run(snimek.xml, snimek.xlsx, snimek.polozky, snimek.sklady, ted(), dalsi(JSON.parse(r.plan)), firma);
          db.prepare("UPDATE behy SET stav='ok',opakovat=NULL WHERE firma=? AND termin=?").run(firma, beh.dalsi);
        } else {
          const opakovat = beh.pokusy < MAX_POKUSU;
          db.prepare("UPDATE firmy SET chyba=?,dalsi=?,lease_token=NULL,lease_do=NULL WHERE firma=?")
            .run(CHYBA_BEHU, opakovat ? beh.dalsi : dalsi(JSON.parse(r.plan)), firma);
          db.prepare("UPDATE behy SET stav=?,opakovat=? WHERE firma=? AND termin=?")
            .run(opakovat ? "retry" : "failed", opakovat ? ted() + RETRY : null, firma, beh.dalsi);
        }
      });
    }
  }

  async function zavrit() {
    if (konci) return;
    konci = true;
    for (const { controller } of aktivni.values()) controller.abort();
    await Promise.allSettled([...aktivni.keys()]);
    db.close();
    klic.fill(0);
  }
  // Také chyba SQLite nebo injektovaného kalendáře musí překročit API pouze
  // jako pevné bezpečné sdělení. Nepřebíráme message, cause ani cizí kód chyby.
  const bezpecnaChyba = (e) => new ChybaPlanovace(e instanceof ChybaPlanovace && (Object.hasOwn(ZPRAVY, e.kod) || zpravaChybyKatalogu(e.kod)) ? e.kod : "ULOZISTE", e instanceof ChybaPlanovace ? e.krok : null);
  const sync = (fn) => (...args) => { try { return fn(...args); } catch (e) { throw bezpecnaChyba(e); } };
  const async = (fn) => async (...args) => { try { return await fn(...args); } catch (e) { throw bezpecnaChyba(e); } };
  return { stav: sync(stav), pripojit: async(pripojit), nastavitPlan: sync(nastavitPlan),
    odpojit: sync(odpojit), vysledek: sync(vysledek), tick: async(tick), zavrit: async(zavrit) };
}
