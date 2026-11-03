// Odeslání podkladů účetní e-mailem. Obsluha požadavků bez závislostí, aby šla testovat;
// SMTP a naslouchání řeší server.mjs. Každé odeslání vyžaduje přístupový kód firmy; server
// zná jen otisky kódů. Posílá se buď ze schránky uživatele (údaje přijdou s požadavkem), nebo
// ze společné adresy služby. Nic se neukládá: přílohy ani přihlašovací údaje nepřežijí
// odeslání a do logu jde jen firma, výsledek, počet příloh a velikost, nikdy adresy, servery,
// kódy ani obsah.
import { createHash } from "node:crypto";
import { BlockList } from "node:net";

const MAX_TELO = 28 * 1024 * 1024;
const MAX_PRILOHY = 20 * 1024 * 1024;
const MAX_PRIJEMCU = 5;
const HODINA = 3600_000;
const LIMIT_ODESLANI = 30;
const LIMIT_VLASTNI = 300;
const LIMIT_FIRMA = 20;
const LIMIT_PRIHLASENI_FIRMA = 5;
const LIMIT_CHYB_KODU = 30;
const MAX_SLEDOVANYCH = 10_000;
const PAMET_ID = 24 * HODINA;

const EMAIL =
  /^[^\s@<>()[\],;:"\\]{1,64}@[^\s@<>()[\],;:"\\]+\.[^\s@<>()[\],;:"\\]{2,}$/;
const NAZEV_PRILOHY = /^[\w.-]{1,120}$/;
const ID = /^[\w:.-]{1,120}$/;
const SERVER = /^(?=.{1,253}$)[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
const PORTY = new Set([465, 587, 2525]);
const TYPY = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xml: "application/xml",
  isdoc: "application/xml",
  zip: "application/zip",
};

// Vnitřní sítě, smyčka a podobné adresy: přes schránku uživatele se nesmí dostat do sítě serveru.
const NEVEREJNE = new BlockList();
for (const [a, p] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 3],
])
  NEVEREJNE.addSubnet(a, p, "ipv4");
for (const [a, p] of [
  ["::", 127],
  ["64:ff9b::", 96],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
])
  NEVEREJNE.addSubnet(a, p, "ipv6");

const chyba = (code) => Object.assign(new Error(code), { code });

/**
 * Přeloží server SMTP uživatele na veřejnou adresu; s ní se pak služba spojí přímo, aby
 * DNS nemohlo mezi kontrolou a spojením ukázat jinam. Neveřejné adresy odmítne.
 */
export async function verejnaAdresa(server, lookup) {
  const adresy = await lookup(server, { all: true }).catch(() => {
    throw chyba("EDNS");
  });
  if (
    !adresy.length ||
    adresy.some((a) =>
      NEVEREJNE.check(a.address, a.family === 6 ? "ipv6" : "ipv4"),
    )
  )
    throw chyba("EBLOKOVANO");
  // Kontejner obvykle nemá IPv6, proto přednost IPv4.
  return (adresy.find((a) => a.family === 4) ?? adresy[0]).address;
}

/** Zkontroluje tělo požadavku; vrací { chyba } nebo zprávu připravenou k odeslání. */
export function zkontrolovat(t) {
  if (!t || typeof t !== "object") return { chyba: "Neplatný požadavek." };
  const { komu, odpovedetNa, predmet, text, prilohy, id, smtp, od } = t;
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
  let schranka;
  if (smtp != null) {
    if (
      typeof smtp !== "object" ||
      typeof smtp.server !== "string" ||
      !SERVER.test(smtp.server) ||
      !PORTY.has(smtp.port)
    )
      return { chyba: "Zkontrolujte server a port poštovní schránky." };
    if (
      typeof smtp.uzivatel !== "string" ||
      !smtp.uzivatel ||
      smtp.uzivatel.length > 254 ||
      typeof smtp.heslo !== "string" ||
      !smtp.heslo ||
      smtp.heslo.length > 512
    )
      return { chyba: "Vyplňte přihlašovací jméno a heslo schránky." };
    if (typeof od !== "string" || od.length > 254 || !EMAIL.test(od))
      return { chyba: "Adresa odesílatele nemá platný tvar." };
    schranka = {
      server: smtp.server.toLowerCase(),
      port: smtp.port,
      uzivatel: smtp.uzivatel,
      heslo: smtp.heslo,
    };
  }
  return {
    // Stejné označení od různých odesílatelů nebo pro jiné adresáty je jiné odeslání.
    klic: createHash("sha256")
      .update(JSON.stringify([id, komu, schranka ? od : ""]))
      .digest("hex"),
    velikost,
    schranka,
    zprava: {
      ...(schranka ? { from: od } : {}),
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
function zpravaChyby(e, vlastni) {
  switch (e?.code) {
    case "EBLOKOVANO":
      return "Tento poštovní server nelze použít. Zadejte veřejný server SMTP svého poskytovatele.";
    case "EDNS":
      return "Server SMTP se nepodařilo najít. Zkontrolujte jeho adresu.";
    case "EAUTH":
      return vlastni
        ? "Schránka odmítla přihlášení. Zkontrolujte jméno a heslo; Gmail a Seznam mohou vyžadovat heslo pro aplikace."
        : "Poštovní server služby odmítl přihlášení.";
    case "ECONNECTION":
    case "ETIMEDOUT":
    case "ESOCKET":
    case "ETLS":
      return vlastni
        ? `Nepodařilo se spojit se serverem SMTP (${e.code}). Zkontrolujte adresu a port.`
        : "Poštovní server služby není dostupný. Zkuste to později.";
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
 * kódů služba neodešle nic. `odeslatVlastni(schranka, zprava)` pošle zprávu ze schránky
 * uživatele, `odeslat(zprava)` ze společné adresy služby; když SMTP služby chybí, odpoví,
 * že společné odesílání není nastavené.
 */
export function vytvoritObsluhu({
  kody = new Map(),
  odeslat,
  odeslatVlastni,
  ted = Date.now,
  log = console.log,
}) {
  const odeslani = [];
  const vlastniOdeslani = [];
  const chybyKodu = new Map();
  const odeslaniFirmy = new Map();
  const chybyPrihlaseni = new Map();
  const probihaVlastni = new Map();
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
        vlastni: !!odeslatVlastni,
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
    const vlastni = !!z.schranka;
    if (vlastni ? !odeslatVlastni : !odeslat)
      return json(res, 503, {
        ok: false,
        chyba: vlastni
          ? "Odesílání z vlastní schránky není na serveru zapnuté."
          : "Společná adresa služby není nastavená. V Nastavení vyplňte svou poštovní schránku.",
      });
    // Rozpracovaná odeslání se počítají jako možná odmítnutí, aby souběh nepřekročil limit.
    if (
      vlastni &&
      zaHodinu(chybyPrihlaseni, firma, nyni).length +
        (probihaVlastni.get(firma) ?? 0) >=
        LIMIT_PRIHLASENI_FIRMA
    )
      return json(res, 429, {
        ok: false,
        chyba:
          "Příliš mnoho neúspěšných přihlášení ke schránce. Zkuste to za hodinu.",
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

    const celkem = vlastni ? vlastniOdeslani : odeslani;
    while (celkem.length && nyni - celkem[0] > HODINA) celkem.shift();
    if (celkem.length >= (vlastni ? LIMIT_VLASTNI : LIMIT_ODESLANI))
      return json(res, 429, {
        ok: false,
        chyba: "Překročen limit odeslání za hodinu. Zkuste to později.",
      });

    zpracovana.set(klic, { stav: "probiha", cas: nyni });
    celkem.push(nyni);
    if (vlastni)
      probihaVlastni.set(firma, (probihaVlastni.get(firma) ?? 0) + 1);
    const rezim = vlastni ? "vlastni" : "spolecna";
    try {
      if (vlastni) await odeslatVlastni(z.schranka, z.zprava);
      else await odeslat(z.zprava);
      zpracovana.set(klic, { stav: "odeslano", cas: nyni });
      zaznam("odeslano", {
        firma,
        rezim,
        priloh: z.zprava.attachments.length,
        kB: Math.round(z.velikost / 1024),
      });
      return json(res, 200, { ok: true });
    } catch (e) {
      zpracovana.delete(klic);
      if (vlastni && e?.code === "EAUTH") pridat(chybyPrihlaseni, firma, nyni);
      zaznam("chyba-smtp", {
        firma,
        rezim,
        kod: e?.code ?? null,
        odpoved: e?.responseCode ?? null,
      });
      return json(res, e?.code === "EBLOKOVANO" ? 400 : 502, {
        ok: false,
        chyba: zpravaChyby(e, vlastni),
      });
    } finally {
      if (vlastni) {
        const n = (probihaVlastni.get(firma) ?? 1) - 1;
        if (n) probihaVlastni.set(firma, n);
        else probihaVlastni.delete(firma);
      }
    }
  };
}
