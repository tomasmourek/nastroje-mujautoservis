// Odeslání podkladů účetní e-mailem. Obsluha požadavků bez závislostí, aby šla testovat;
// SMTP a naslouchání řeší server.mjs. Posílá se buď ze schránky uživatele (údaje přijdou
// s požadavkem), nebo ze společné adresy služby, k níž je potřeba klíč. Nic se neukládá:
// přílohy ani přihlašovací údaje nepřežijí odeslání a do logu jde jen výsledek, počet příloh
// a velikost, nikdy adresy, servery ani obsah.
import { createHash, timingSafeEqual } from "node:crypto";
import { BlockList } from "node:net";

const MAX_TELO = 28 * 1024 * 1024;
const MAX_PRILOHY = 20 * 1024 * 1024;
const MAX_PRIJEMCU = 5;
const HODINA = 3600_000;
const LIMIT_ODESLANI = 30;
const LIMIT_CHYB_KLICE = 10;
const LIMIT_VLASTNI = 300;
const LIMIT_VLASTNI_IP = 20;
const LIMIT_PRIHLASENI_IP = 5;
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
  return adresy[0].address;
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

function shodnyKlic(zadany, platny) {
  const h = (v) => createHash("sha256").update(String(v)).digest();
  return timingSafeEqual(h(zadany), h(platny));
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
        ? "Nepodařilo se spojit se serverem SMTP. Zkontrolujte adresu a port."
        : "Poštovní server služby není dostupný. Zkuste to později.";
  }
  return `Poštovní server zprávu nepřijal${e?.responseCode ? ` (kód ${e.responseCode})` : ""}. Zkuste to později.`;
}

/** Časy za poslední hodinu z mapy podle klíče (adresy klienta). */
const zaHodinu = (mapa, k, nyni) =>
  (mapa.get(k) ?? []).filter((t) => nyni - t < HODINA);

/**
 * Vytvoří obsluhu požadavků. `odeslatVlastni(schranka, zprava)` pošle zprávu ze schránky
 * uživatele, `odeslat(zprava)` ze společné adresy služby; ta vyžaduje klíč, a když klíč
 * nebo SMTP chybí, služba odpoví, že společné odesílání není nastavené.
 */
export function vytvoritObsluhu({
  klic,
  odeslat,
  odeslatVlastni,
  ted = Date.now,
  log = console.log,
}) {
  const pripraveno = !!odeslat && typeof klic === "string" && klic.length >= 16;
  const odeslani = [];
  const vlastniOdeslani = [];
  const chybyKlice = new Map();
  const odeslaniIp = new Map();
  const chybyPrihlaseni = new Map();
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
      return json(res, 200, { pripraveno, vlastni: !!odeslatVlastni });
    if (cesta !== "/sestavy/api/odeslat")
      return json(res, 404, { ok: false, chyba: "Nenalezeno." });
    if (req.method !== "POST")
      return json(res, 405, { ok: false, chyba: "Nepovolená metoda." });
    const nyni = ted();
    const ip = adresaKlienta(req);
    const zadany =
      /^Bearer (.+)$/.exec(String(req.headers.authorization ?? ""))?.[1] ?? "";
    // Bez klíče se posílá ze schránky uživatele; limity se kontrolují ještě před čtením těla.
    const vlastni = !zadany;
    if (vlastni) {
      if (!odeslatVlastni)
        return json(res, 503, {
          ok: false,
          chyba: "Odesílání z vlastní schránky není na serveru zapnuté.",
        });
      if (zaHodinu(chybyPrihlaseni, ip, nyni).length >= LIMIT_PRIHLASENI_IP)
        return json(res, 429, {
          ok: false,
          chyba:
            "Příliš mnoho neúspěšných přihlášení ke schránce. Zkuste to za hodinu.",
        });
      if (zaHodinu(odeslaniIp, ip, nyni).length >= LIMIT_VLASTNI_IP)
        return json(res, 429, {
          ok: false,
          chyba: "Překročen limit odeslání za hodinu. Zkuste to později.",
        });
    } else {
      if (!pripraveno)
        return json(res, 503, {
          ok: false,
          chyba: "Odesílání ze společné adresy není na serveru nastavené.",
        });
      const chyby = zaHodinu(chybyKlice, ip, nyni);
      if (chyby.length >= LIMIT_CHYB_KLICE)
        return json(res, 429, {
          ok: false,
          chyba: "Příliš mnoho pokusů s neplatným klíčem. Zkuste to za hodinu.",
        });
      if (!shodnyKlic(zadany, klic)) {
        chybyKlice.set(ip, [...chyby, nyni]);
        zaznam("neplatny-klic");
        return json(res, 401, {
          ok: false,
          chyba: "Klíč pro odesílání nesouhlasí s nastavením serveru.",
        });
      }
    }

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
    if (vlastni !== !!z.schranka)
      return json(res, 400, {
        ok: false,
        chyba: vlastni
          ? "V Nastavení vyplňte svou poštovní schránku, nebo klíč pro odesílání ze společné adresy."
          : "Neplatný požadavek.",
      });

    // Opakované odeslání téhož (dvě karty, nový pokus po výpadku spojení) se neodešle podruhé.
    for (const [id, t] of zpracovana)
      if (nyni - t.cas > PAMET_ID) zpracovana.delete(id);
    const predtim = zpracovana.get(z.klic);
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

    zpracovana.set(z.klic, { stav: "probiha", cas: nyni });
    celkem.push(nyni);
    if (vlastni) odeslaniIp.set(ip, [...zaHodinu(odeslaniIp, ip, nyni), nyni]);
    const rezim = vlastni ? "vlastni" : "spolecna";
    try {
      if (vlastni) await odeslatVlastni(z.schranka, z.zprava);
      else await odeslat(z.zprava);
      zpracovana.set(z.klic, { stav: "odeslano", cas: nyni });
      zaznam("odeslano", {
        rezim,
        priloh: z.zprava.attachments.length,
        kB: Math.round(z.velikost / 1024),
      });
      return json(res, 200, { ok: true });
    } catch (e) {
      zpracovana.delete(z.klic);
      if (vlastni && e?.code === "EAUTH")
        chybyPrihlaseni.set(ip, [...zaHodinu(chybyPrihlaseni, ip, nyni), nyni]);
      zaznam("chyba-smtp", {
        rezim,
        kod: e?.code ?? null,
        odpoved: e?.responseCode ?? null,
      });
      return json(res, e?.code === "EBLOKOVANO" ? 400 : 502, {
        ok: false,
        chyba: zpravaChyby(e, vlastni),
      });
    }
  };
}
