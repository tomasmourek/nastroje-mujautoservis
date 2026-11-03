// Odeslání podkladů účetní e-mailem. Obsluha požadavků bez závislostí, aby šla testovat;
// SMTP a naslouchání řeší server.mjs. Každé odeslání vyžaduje přístupový kód firmy; server
// zná jen otisky kódů. Posílá se ze společné adresy služby, odpovědi jdou na e-mail firmy.
// Nic se neukládá: přílohy nepřežijí odeslání a do logu jde jen firma, výsledek, počet příloh
// a velikost, nikdy adresy, kódy ani obsah.
import { createHash } from "node:crypto";

const MAX_TELO = 28 * 1024 * 1024;
const MAX_PRILOHY = 20 * 1024 * 1024;
const MAX_PRIJEMCU = 5;
const HODINA = 3600_000;
const LIMIT_ODESLANI = 30;
const LIMIT_FIRMA = 20;
const LIMIT_CHYB_KODU = 30;
const MAX_SLEDOVANYCH = 10_000;
const PAMET_ID = 24 * HODINA;

const EMAIL =
  /^[^\s@<>()[\],;:"\\]{1,64}@[^\s@<>()[\],;:"\\]+\.[^\s@<>()[\],;:"\\]{2,}$/;
const NAZEV_PRILOHY = /^[\w.-]{1,120}$/;
const ID = /^[\w:.-]{1,120}$/;
const TYPY = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xml: "application/xml",
  isdoc: "application/xml",
  zip: "application/zip",
};

/** Zkontroluje tělo požadavku; vrací { chyba } nebo zprávu připravenou k odeslání. */
export function zkontrolovat(t) {
  if (!t || typeof t !== "object") return { chyba: "Neplatný požadavek." };
  // Případné údaje ke schránce ze starší verze stránky se nepoužijí.
  const { komu, odpovedetNa, predmet, text, prilohy, id } = t;
  if (typeof id !== "string" || !ID.test(id))
    return { chyba: "Chybí označení odeslání." };
  if (
    !Array.isArray(komu) ||
    !komu.length ||
    komu.length > MAX_PRIJEMCU ||
    !komu.every(
      (a) => typeof a === "string" && a.length <= 254 && EMAIL.test(a),
    )
  )
    return { chyba: "Zkontrolujte e-mailovou adresu účetní." };
  if (
    odpovedetNa != null &&
    odpovedetNa !== "" &&
    !(typeof odpovedetNa === "string" && EMAIL.test(odpovedetNa))
  )
    return { chyba: "E-mail firmy v Nastavení nemá platný tvar." };
  if (
    typeof predmet !== "string" ||
    !predmet.trim() ||
    predmet.length > 200 ||
    /[\r\n]/.test(predmet)
  )
    return { chyba: "Neplatný předmět zprávy." };
  if (typeof text !== "string" || text.length > 50_000)
    return { chyba: "Neplatný text zprávy." };
  if (!Array.isArray(prilohy) || prilohy.length > 10)
    return { chyba: "Neplatné přílohy." };
  let velikost = 0;
  const prilozene = [];
  for (const p of prilohy) {
    const pripona =
      typeof p?.nazev === "string"
        ? p.nazev.split(".").pop().toLowerCase()
        : "";
    if (
      !NAZEV_PRILOHY.test(p?.nazev ?? "") ||
      !TYPY[pripona] ||
      typeof p.data !== "string"
    )
      return { chyba: "Neplatná příloha." };
    const obsah = Buffer.from(p.data, "base64");
    velikost += obsah.length;
    if (velikost > MAX_PRILOHY)
      return { chyba: "Přílohy jsou dohromady větší než 20 MB." };
    prilozene.push({
      filename: p.nazev,
      content: obsah,
      contentType: TYPY[pripona],
    });
  }
  return {
    // Stejné označení pro jiné adresáty je jiné odeslání.
    klic: createHash("sha256").update(JSON.stringify([id, komu])).digest("hex"),
    velikost,
    zprava: {
      to: komu,
      replyTo: odpovedetNa || undefined,
      subject: predmet.trim(),
      text,
      attachments: prilozene,
    },
  };
}

/** Tvar kódu k porovnání: mezery, pomlčky (i typografické) a velikost písmen nerozhodují. */
const tvarKodu = (kod) =>
  String(kod)
    .replace(/[\s\-‐-―]+/g, "")
    .toUpperCase();
const MIN_DELKA_KODU = 20;

/** Otisk přístupového kódu. */
export const otiskKodu = (kod) =>
  createHash("sha256").update(tvarKodu(kod)).digest("hex");

/**
 * Povolené kódy z proměnné prostředí: položky „firma:otisk“ oddělené čárkou nebo řádkem.
 * Vrací mapu otisk → firma; neplatné položky přeskočí a ohlásí jen jejich pořadí.
 */
export function nacistKody(text = "", varovat = console.warn) {
  const kody = new Map();
  String(text)
    .split(/[\s,]+/)
    .filter(Boolean)
    .forEach((polozka, i) => {
      const [, firma, otisk] =
        /^([a-z0-9-]{1,40}):([0-9a-f]{64})$/.exec(polozka) ?? [];
      // Otisk prázdného kódu by pustil kohokoli; stejný otisk u dvou firem je chyba zápisu.
      if (!otisk || otisk === otiskKodu("") || kody.has(otisk))
        varovat(`PRISTUPOVE_KODY: neplatná položka č. ${i + 1}`);
      else kody.set(otisk, firma);
    });
  return kody;
}

/** Poslední adresa v X-Forwarded-For doplnila proxy (Traefik), dřívější mohl podvrhnout klient. */
function adresaKlienta(req) {
  const xff = String(req.headers["x-forwarded-for"] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return xff.at(-1) ?? req.socket.remoteAddress ?? "";
}

function cist(req) {
  return new Promise((splnit, selhat) => {
    const casti = [];
    let delka = 0;
    req.on("data", (c) => {
      delka += c.length;
      if (delka > MAX_TELO) {
        selhat(Object.assign(new Error("velke"), { kod: 413 }));
        req.destroy();
      } else casti.push(c);
    });
    req.on("end", () => splnit(Buffer.concat(casti)));
    req.on("error", selhat);
  });
}

/** Srozumitelná zpráva pro uživatele podle chyby SMTP. */
function zpravaChyby(e) {
  switch (e?.code) {
    case "EAUTH":
      return "Poštovní server služby odmítl přihlášení.";
    case "ECONNECTION":
    case "ETIMEDOUT":
    case "ESOCKET":
    case "ETLS":
      return "Poštovní server služby není dostupný. Zkuste to později.";
  }
  return `Poštovní server zprávu nepřijal${e?.responseCode ? ` (kód ${e.responseCode})` : ""}. Zkuste to později.`;
}

/** Časy za poslední hodinu z mapy podle klíče (adresy klienta nebo firmy). */
const zaHodinu = (mapa, k, nyni) =>
  (mapa.get(k) ?? []).filter((t) => nyni - t < HODINA);

/** Přidá čas ke klíči; mapa drží nejvýš MAX_SLEDOVANYCH klíčů, nejstarší zápisy vypadnou. */
function pridat(mapa, k, nyni) {
  const casy = [...zaHodinu(mapa, k, nyni), nyni];
  mapa.delete(k);
  for (const j of mapa.keys()) {
    if (mapa.size < MAX_SLEDOVANYCH) break;
    mapa.delete(j);
  }
  mapa.set(k, casy);
}

/**
 * Vytvoří obsluhu požadavků. `kody` je mapa otisk kódu → firma (viz `nacistKody`); bez
 * kódů služba neodešle nic. `odeslat(zprava)` pošle zprávu ze společné adresy služby; když
 * SMTP služby chybí, odpoví, že odesílání není nastavené.
 */
export function vytvoritObsluhu({
  kody = new Map(),
  odeslat,
  ted = Date.now,
  log = console.log,
}) {
  const odeslani = [];
  const chybyKodu = new Map();
  const odeslaniFirmy = new Map();
  const zpracovana = new Map();

  const json = (res, kod, telo) => {
    res.writeHead(kod, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(telo));
  };
  const zaznam = (udalost, dalsi = {}) =>
    log(
      JSON.stringify({ cas: new Date(ted()).toISOString(), udalost, ...dalsi }),
    );

  return async (req, res) => {
    const cesta = (req.url ?? "").split("?")[0];
    if (req.method === "GET" && cesta === "/sestavy/api/stav")
      return json(res, 200, {
        pripraveno: !!odeslat,
        kody: kody.size > 0,
      });
    if (cesta !== "/sestavy/api/odeslat")
      return json(res, 404, { ok: false, chyba: "Nenalezeno." });
    if (req.method !== "POST")
      return json(res, 405, { ok: false, chyba: "Nepovolená metoda." });
    if (!kody.size)
      return json(res, 503, {
        ok: false,
        chyba: "Odesílání není na serveru nastavené.",
      });
    const nyni = ted();
    const ip = adresaKlienta(req);

    // Kód a limity se kontrolují ještě před čtením těla. Požadavek bez kódu se do pokusů
    // nepočítá: hlavičku Authorization cizí stránka bez souhlasu serveru (CORS) nepošle,
    // jednoduchým požadavkem bez ní by ale mohla adresu uživatele zablokovat.
    const zadany =
      /^Bearer\s+(\S.*)$/i.exec(String(req.headers.authorization ?? ""))?.[1] ??
      "";
    if (!zadany)
      return json(res, 401, {
        ok: false,
        chyba: "V Nastavení vyplňte přístupový kód pro odesílání.",
      });
    if (zaHodinu(chybyKodu, ip, nyni).length >= LIMIT_CHYB_KODU)
      return json(res, 429, {
        ok: false,
        chyba: "Příliš mnoho pokusů s neplatným kódem. Zkuste to za hodinu.",
      });
    const firma =
      tvarKodu(zadany).length >= MIN_DELKA_KODU
        ? kody.get(otiskKodu(zadany))
        : undefined;
    if (!firma) {
      pridat(chybyKodu, ip, nyni);
      zaznam("neplatny-kod");
      return json(res, 401, {
        ok: false,
        chyba:
          "Přístupový kód pro odesílání neplatí. Zkontrolujte ho v Nastavení.",
      });
    }
    // Pokus se započítá hned, aby souběžné požadavky limit nepřeskočily.
    if (zaHodinu(odeslaniFirmy, firma, nyni).length >= LIMIT_FIRMA)
      return json(res, 429, {
        ok: false,
        chyba: "Překročen limit odeslání za hodinu. Zkuste to později.",
      });
    pridat(odeslaniFirmy, firma, nyni);

    let telo;
    try {
      telo = JSON.parse((await cist(req)).toString("utf8"));
    } catch (e) {
      return json(res, e?.kod ?? 400, {
        ok: false,
        chyba: e?.kod ? "Přílohy jsou příliš velké." : "Neplatný požadavek.",
      });
    }
    const z = zkontrolovat(telo);
    if (z.chyba) return json(res, 400, { ok: false, chyba: z.chyba });
    if (!odeslat)
      return json(res, 503, {
        ok: false,
        chyba: "Společná adresa služby není nastavená. Zkuste to později.",
      });

    // Opakované odeslání téhož (dvě karty, nový pokus po výpadku spojení) se neodešle podruhé;
    // stejné období jiné firmy pro stejnou účetní je jiné odeslání.
    const klic = `${firma}:${z.klic}`;
    for (const [id, t] of zpracovana)
      if (nyni - t.cas > PAMET_ID) zpracovana.delete(id);
    const predtim = zpracovana.get(klic);
    if (predtim?.stav === "odeslano")
      return json(res, 200, { ok: true, duplicitni: true });
    if (predtim?.stav === "probiha")
      return json(res, 409, {
        ok: false,
        chyba: "Stejné odeslání právě probíhá.",
      });

    while (odeslani.length && nyni - odeslani[0] > HODINA) odeslani.shift();
    if (odeslani.length >= LIMIT_ODESLANI)
      return json(res, 429, {
        ok: false,
        chyba: "Překročen limit odeslání za hodinu. Zkuste to později.",
      });

    zpracovana.set(klic, { stav: "probiha", cas: nyni });
    odeslani.push(nyni);
    try {
      await odeslat(z.zprava);
      zpracovana.set(klic, { stav: "odeslano", cas: nyni });
      zaznam("odeslano", {
        firma,
        priloh: z.zprava.attachments.length,
        kB: Math.round(z.velikost / 1024),
      });
      return json(res, 200, { ok: true });
    } catch (e) {
      zpracovana.delete(klic);
      zaznam("chyba-smtp", {
        firma,
        kod: e?.code ?? null,
        odpoved: e?.responseCode ?? null,
      });
      return json(res, 502, { ok: false, chyba: zpravaChyby(e) });
    }
  };
}
