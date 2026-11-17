import { DatabaseSync } from "node:sqlite";
import { mkdir, chmod } from "node:fs/promises";
import { dirname } from "node:path";
import { randomBytes, randomUUID, createCipheriv, createDecipheriv } from "node:crypto";
import { zkontrolovat } from "./odeslani.mjs";

const LEASE = 20 * 60_000;
const TEXT = {
  PLAN: "Zkontrolujte plán, IČO firmy, příjemce a vybrané přílohy.",
  PRIPOJENI: "Nejprve připojte IC Office v Exportu skladového katalogu.",
  FIRMA: "IC Office nepotvrdil očekávané IČO firmy. Plán nebyl aktivován.",
  IMPORT: "Úplné podklady se nepodařilo připravit. Žádný e-mail nebyl odeslán. Běh je pozastavený; po kontrole obnovte plán.",
  NEJISTE: "Výsledek odeslání není potvrzený. Plán je zastavený proti zdvojení. Nejdříve ověřte doručení u účetní nebo správce.",
  OBSAZENO: "Připojení právě používá jiný běh. Zkuste to po jeho dokončení.",
  ULOZISTE: "Úložiště automatického odesílání není dostupné.",
};
export class ChybaUcetnihoPlanovace extends Error {
  constructor(kod) { super(TEXT[kod] ?? TEXT.ULOZISTE); this.kod = Object.hasOwn(TEXT, kod) ? kod : "ULOZISTE"; }
}
const mistniDen = (datum) => {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(datum);
  const v = (typ) => Number(p.find(x => x.type === typ).value);
  return new Date(Date.UTC(v("year"), v("month") - 1, v("day")));
};
const iso = (d) => d.toISOString().slice(0, 10);
/** Období patří splatnému termínu, nikoli okamžiku případného restartu. */
export function obdobiUcetnihoBehu(plan, termin) {
  const den = mistniDen(new Date(termin));
  if (plan.cetnost === "mesicne") return {
    od: iso(new Date(Date.UTC(den.getUTCFullYear(), den.getUTCMonth() - 1, 1))),
    do: iso(new Date(Date.UTC(den.getUTCFullYear(), den.getUTCMonth(), 0))),
  };
  do { den.setUTCDate(den.getUTCDate() - 1); } while ([0, 6].includes(den.getUTCDay()));
  return { od: iso(den), do: iso(den) };
}
function sifra(klic, firma, text) {
  const iv = randomBytes(12), c = createCipheriv("aes-256-gcm", klic, iv);
  c.setAAD(Buffer.from(`ucetni-v1:${firma}`));
  const data = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]);
}
function cistSifru(klic, firma, blob) {
  const b = Buffer.from(blob), c = createDecipheriv("aes-256-gcm", klic, b.subarray(0, 12));
  c.setAAD(Buffer.from(`ucetni-v1:${firma}`)); c.setAuthTag(b.subarray(12, 28));
  return JSON.parse(Buffer.concat([c.update(b.subarray(28)), c.final()]).toString("utf8"));
}

/** Nastavení je šifrované, přílohy existují pouze po dobu běhu. Závislosti jsou injektované pro testy bez SMTP. */
export async function otevritUcetniPlanovac({ cesta, klic, pripojeni, denik, platnyPlan, pristiTermin,
  overitNastaveni, overitFirmu, pripravit, odeslat, ted = Date.now }) {
  if (!Buffer.isBuffer(klic) || klic.length !== 32 || !pripojeni || !denik || typeof odeslat !== "function") throw new ChybaUcetnihoPlanovace("ULOZISTE");
  klic = Buffer.from(klic);
  let db;
  try {
    await mkdir(dirname(cesta), { recursive: true, mode: 0o700 }); await chmod(dirname(cesta), 0o700);
    db = new DatabaseSync(cesta); await chmod(cesta, 0o600);
    db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA secure_delete=ON;
      CREATE TABLE IF NOT EXISTS ucetni_metadata (id INTEGER PRIMARY KEY, kontrola BLOB NOT NULL);
      CREATE TABLE IF NOT EXISTS ucetni_plany (firma TEXT PRIMARY KEY, rev TEXT NOT NULL, nastaveni BLOB,
        aktivni INTEGER NOT NULL DEFAULT 0, dalsi INTEGER, uspech INTEGER, chyba TEXT, lease TEXT, lease_do INTEGER);
      CREATE TABLE IF NOT EXISTS ucetni_behy (firma TEXT NOT NULL, obdobi TEXT NOT NULL,
        stav TEXT NOT NULL, cas INTEGER NOT NULL, PRIMARY KEY(firma,obdobi));`);
    const kontrola = db.prepare("SELECT kontrola FROM ucetni_metadata WHERE id=1").get();
    if (kontrola) { if (cistSifru(klic, "kontrola", kontrola.kontrola) !== "ucetni-v1") throw new Error(); }
    else db.prepare("INSERT INTO ucetni_metadata VALUES (1,?)").run(sifra(klic, "kontrola", JSON.stringify("ucetni-v1")));
  } catch { try { db?.close(); } catch { /* otevření selhalo */ } klic.fill(0); throw new ChybaUcetnihoPlanovace("ULOZISTE"); }
  let konci = false;
  const aktivni = new Map();
  const nastavovani = new Set();
  const overovani = new Map();
  const transakce = (fn) => { db.exec("BEGIN IMMEDIATE"); try { const v = fn(); db.exec("COMMIT"); return v; } catch (e) { db.exec("ROLLBACK"); throw e; } };
  const radek = firma => db.prepare("SELECT * FROM ucetni_plany WHERE firma=?").get(firma);
  const overitFirmuId = firma => {
    if (konci || typeof firma !== "string" || !/^email-[a-f0-9]{32}$/.test(firma)) throw new ChybaUcetnihoPlanovace("ULOZISTE");
    return pripojeni.stav(firma);
  };
  const dalsi = (plan, od = ted()) => {
    const cas = pristiTermin(plan, new Date(od)).getTime();
    if (!Number.isFinite(cas) || cas <= od) throw new ChybaUcetnihoPlanovace("PLAN");
    return cas;
  };
  function stav(firma) {
    const p = overitFirmuId(firma), r = radek(firma);
    const n = r?.nastaveni ? cistSifru(klic, firma, r.nastaveni) : null;
    return { pripraveno: true, pripojeno: p.pripojeno, aktivni: !!r?.aktivni && p.pripojeno,
      plan: n?.plan ?? null, prijemci: n?.nastaveni.odeslani.komu ?? null, overenaFirma: n?.firma ?? null,
      pristiTermin: r?.aktivni && p.pripojeno && r.dalsi != null ? new Date(r.dalsi).toISOString() : null,
      posledniUspech: r?.uspech != null ? new Date(r.uspech).toISOString() : null, chyba: r?.chyba ?? null };
  }
  async function nastavitPlan(firma, data) {
    const p = overitFirmuId(firma);
    if (!p.pripojeno) throw new ChybaUcetnihoPlanovace("PRIPOJENI");
    let nastaveni, plan;
    try {
      if (!data || data.souhlas !== true || Object.keys(data).some(k => !["plan", "nastaveni", "souhlas"].includes(k)) ||
        !platnyPlan(data.plan) || !["denne", "mesicne"].includes(data.plan.cetnost)) throw new Error();
      nastaveni = overitNastaveni(data.nastaveni);
      const { cetnost, cas, denTydne, denMesice, zona } = data.plan;
      plan = { cetnost, cas, denTydne, denMesice, zona };
    } catch { throw new ChybaUcetnihoPlanovace("PLAN"); }
    // Změna aktivního běhu a jeho příjemců počká na konec, nikdy jej nenahradí během SMTP.
    const pred = radek(firma);
    if (pred?.lease && pred.lease_do > ted()) throw new ChybaUcetnihoPlanovace("OBSAZENO");
    const controller = new AbortController();
    let overene = overovani.get(firma);
    if (!overene) { overene = new Set(); overovani.set(firma, overene); }
    overene.add(controller);
    try {
      return await pripojeni.sPripojenim(firma, async ({ prihlaseni, signal, overitAktualnost }) => {
        const overena = await overitFirmu({ prihlaseni, ocekavaneIco: nastaveni.firma.ico, signal: AbortSignal.any([signal, controller.signal]) });
        overitAktualnost(); overitFirmuId(firma);
        if (controller.signal.aborted) throw new ChybaUcetnihoPlanovace("OBSAZENO");
        if (overena?.ico !== nastaveni.firma.ico || typeof overena?.nazev !== "string" || !overena.nazev.trim()) throw new ChybaUcetnihoPlanovace("FIRMA");
        return transakce(() => {
          const r = radek(firma);
          if ((r?.rev ?? null) !== (pred?.rev ?? null) || (r?.lease && r.lease_do > ted())) throw new ChybaUcetnihoPlanovace("OBSAZENO");
          const staryPlan = r?.nastaveni ? cistSifru(klic, firma, r.nastaveni).plan : null;
          // Obnovení stejného rozvrhu dohání původní období. Explicitní zastavení
          // nebo změna rozvrhu zakládá nový budoucí termín.
          const termin = r?.dalsi != null && JSON.stringify(staryPlan) === JSON.stringify(plan) ? r.dalsi : dalsi(plan);
          const konfigurace = { plan, nastaveni, firma: overena, souhlas: new Date(ted()).toISOString() };
          db.prepare(`INSERT INTO ucetni_plany(firma,rev,nastaveni,aktivni,dalsi) VALUES (?,?,?,1,?)
            ON CONFLICT(firma) DO UPDATE SET rev=excluded.rev,nastaveni=excluded.nastaveni,aktivni=1,dalsi=excluded.dalsi,chyba=NULL`)
            .run(firma, randomUUID(), sifra(klic, firma, JSON.stringify(konfigurace)), termin);
          return stav(firma);
        });
      });
    } catch (e) { throw new ChybaUcetnihoPlanovace(e?.kod === "OBSAZENO" ? "OBSAZENO" : "FIRMA"); }
    finally { overene.delete(controller); if (!overene.size) overovani.delete(firma); }
  }
  function zastavit(firma, odstranit = false) {
    overitFirmuId(firma);
    db.prepare(`INSERT INTO ucetni_plany(firma,rev) VALUES (?,?) ON CONFLICT(firma) DO UPDATE SET
      aktivni=0,dalsi=NULL,rev=excluded.rev,nastaveni=CASE WHEN ? THEN NULL ELSE nastaveni END`)
      .run(firma, randomUUID(), Number(odstranit));
    aktivni.get(firma)?.abort();
    for (const controller of overovani.get(firma) ?? []) controller.abort();
    return stav(firma);
  }
  async function tick() {
    if (konci) return;
    for (const kandidat of db.prepare("SELECT firma FROM ucetni_plany WHERE aktivni=1 AND dalsi<=?").all(ted())) {
      if (konci) return;
      const firma = kandidat.firma;
      let r, controller;
      try {
        r = transakce(() => {
          const v = radek(firma);
          if (!v?.aktivni || v.dalsi > ted() || (v.lease && v.lease_do > ted())) return null;
          const token = randomUUID();
          db.prepare("UPDATE ucetni_plany SET lease=?,lease_do=? WHERE firma=?").run(token, ted() + LEASE, firma);
          return { ...v, token };
        });
        if (!r) continue;
        controller = new AbortController(); aktivni.set(firma, controller);
        const n = cistSifru(klic, firma, r.nastaveni), obdobi = obdobiUcetnihoBehu(n.plan, r.dalsi);
        const id = `ucetni:${obdobi.od}:${obdobi.do}`;
        const overit = () => {
          const v = radek(firma);
          if (konci || controller.signal.aborted || !v?.aktivni || v.rev !== r.rev || v.lease !== r.token || v.lease_do <= ted()) throw new ChybaUcetnihoPlanovace("OBSAZENO");
          overitFirmuId(firma);
        };
        const pred = db.prepare("SELECT stav FROM ucetni_behy WHERE firma=? AND obdobi=?").get(firma, id);
        if (pred && pred.stav !== "odeslano") throw new ChybaUcetnihoPlanovace("NEJISTE");
        if (!pred) await pripojeni.sPripojenim(firma, async ({ prihlaseni, signal, overitAktualnost }) => {
          const spojeny = AbortSignal.any([signal, controller.signal]);
          const zprava = await pripravit({ prihlaseni, signal: spojeny, nastaveni: n.nastaveni, obdobi, ocekavaneIco: n.firma.ico });
          overit(); overitAktualnost();
          if (zprava.firma?.ico !== n.firma.ico) throw new ChybaUcetnihoPlanovace("FIRMA");
          const z = zkontrolovat({ ...zprava, id });
          if (z.chyba || !z.zprava.attachments.length) throw new ChybaUcetnihoPlanovace("IMPORT");
          // Po tomto zápisu je pád procesu vždy nejistý, a tedy bez automatického opakování.
          const pokus = denik.zahajit({ firma, id, otisk: z.otisk });
          if (pokus.stav === "odeslano") {
            db.prepare("INSERT OR REPLACE INTO ucetni_behy VALUES (?,?,'odeslano',?)").run(firma, id, ted()); return;
          }
          if (pokus.stav !== "nove") throw new ChybaUcetnihoPlanovace("NEJISTE");
          db.prepare("INSERT OR REPLACE INTO ucetni_behy VALUES (?,?,'nejiste',?)").run(firma, id, ted());
          try {
            overit(); overitAktualnost();
            await odeslat({ ...z.zprava, messageId: `<${firma}.${obdobi.od}.${obdobi.do}@nastroje.mujautoservis.eu>` });
            denik.dokoncit({ firma, id, token: pokus.token, stav: "odeslano" });
            db.prepare("UPDATE ucetni_behy SET stav='odeslano',cas=? WHERE firma=? AND obdobi=?").run(ted(), firma, id);
          } catch {
            try { denik.dokoncit({ firma, id, token: pokus.token, stav: "nejiste" }); } catch { /* trvalý stav probiha také blokuje */ }
            throw new ChybaUcetnihoPlanovace("NEJISTE");
          }
        });
        overit();
        db.prepare("UPDATE ucetni_plany SET uspech=?,chyba=NULL,dalsi=?,lease=NULL,lease_do=NULL WHERE firma=? AND lease=?")
          .run(ted(), dalsi(n.plan, r.dalsi), firma, r.token);
      } catch (e) {
        if (!konci && r) {
          const kod = e?.kod === "OBSAZENO" ? "OBSAZENO" : e instanceof ChybaUcetnihoPlanovace ? e.kod : "IMPORT";
          // Obsazený katalog se zkusí při dalším ticku. Ostatní chyby vyžadují vědomou kontrolu a obnovení.
          db.prepare(`UPDATE ucetni_plany SET aktivni=CASE WHEN ? THEN aktivni ELSE 0 END,
            chyba=?,lease=NULL,lease_do=NULL WHERE firma=? AND lease=?`)
            .run(Number(e?.kod === "OBSAZENO" && !controllerAborted(firma)), TEXT[kod] ?? TEXT.IMPORT, firma, r.token);
        }
      } finally { if (controller && aktivni.get(firma) === controller) aktivni.delete(firma); }
    }
  }
  const controllerAborted = firma => aktivni.get(firma)?.signal.aborted;
  async function zavrit() {
    konci = true;
    for (const c of aktivni.values()) c.abort();
    for (const skupina of overovani.values()) for (const c of skupina) c.abort();
    // Volající nejprve vyčká rozběhnuté tick; databázi nepoužívá žádný další callback.
    await Promise.allSettled([...nastavovani]);
    while (aktivni.size) await new Promise(resolve => setTimeout(resolve, 10));
    db.close(); klic.fill(0);
  }
  const nastavit = (firma, data) => {
    const p = nastavitPlan(firma, data).finally(() => nastavovani.delete(p));
    nastavovani.add(p); return p;
  };
  return { stav, nastavitPlan: nastavit, zastavit, odpojit: firma => zastavit(firma, true), tick, zavrit };
}
