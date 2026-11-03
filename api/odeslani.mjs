// Odeslání podkladů účetní e-mailem. Obsluha požadavků bez závislostí, aby šla testovat;
// SMTP a naslouchání řeší server.mjs. Nic se neukládá: přílohy jsou v paměti jen do odeslání
// a do logu jde jen výsledek, počet příloh a velikost, nikdy adresy ani obsah.
import { createHash, timingSafeEqual } from "node:crypto";

const MAX_TELO = 28 * 1024 * 1024;
const MAX_PRILOHY = 20 * 1024 * 1024;
const MAX_PRIJEMCU = 5;
const HODINA = 3600_000;
const LIMIT_ODESLANI = 30;
const LIMIT_CHYB_KLICE = 10;
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
    id,
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

/**
 * Vytvoří obsluhu požadavků. `odeslat(zprava)` doručí zprávu přes SMTP; když chybí klíč
 * nebo SMTP, služba odpoví, že odesílání není nastavené.
 */
export function vytvoritObsluhu({
  klic,
  odeslat,
  ted = Date.now,
  log = console.log,
}) {
  const pripraveno = !!odeslat && typeof klic === "string" && klic.length >= 16;
  const odeslani = [];
  const chybyKlice = new Map();
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
      return json(res, 200, { pripraveno });
    if (cesta !== "/sestavy/api/odeslat")
      return json(res, 404, { ok: false, chyba: "Nenalezeno." });
    if (req.method !== "POST")
      return json(res, 405, { ok: false, chyba: "Nepovolená metoda." });
    if (!pripraveno)
      return json(res, 503, {
        ok: false,
        chyba: "Odesílání e-mailem není na serveru nastavené.",
      });

    const nyni = ted();
    const ip = adresaKlienta(req);
    const chyby = (chybyKlice.get(ip) ?? []).filter((t) => nyni - t < HODINA);
    if (chyby.length >= LIMIT_CHYB_KLICE)
      return json(res, 429, {
        ok: false,
        chyba: "Příliš mnoho pokusů s neplatným klíčem. Zkuste to za hodinu.",
      });
    const zadany =
      /^Bearer (.+)$/.exec(String(req.headers.authorization ?? ""))?.[1] ?? "";
    if (!shodnyKlic(zadany, klic)) {
      chybyKlice.set(ip, [...chyby, nyni]);
      zaznam("neplatny-klic");
      return json(res, 401, {
        ok: false,
        chyba: "Klíč pro odesílání nesouhlasí s nastavením serveru.",
      });
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

    // Opakované odeslání téhož (dvě karty, nový pokus po výpadku spojení) se neodešle podruhé.
    for (const [id, t] of zpracovana)
      if (nyni - t.cas > PAMET_ID) zpracovana.delete(id);
    const predtim = zpracovana.get(z.id);
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

    zpracovana.set(z.id, { stav: "probiha", cas: nyni });
    odeslani.push(nyni);
    try {
      await odeslat(z.zprava);
      zpracovana.set(z.id, { stav: "odeslano", cas: nyni });
      zaznam("odeslano", {
        priloh: z.zprava.attachments.length,
        kB: Math.round(z.velikost / 1024),
      });
      return json(res, 200, { ok: true });
    } catch (e) {
      zpracovana.delete(z.id);
      zaznam("chyba-smtp", {
        kod: e?.code ?? null,
        odpoved: e?.responseCode ?? null,
      });
      return json(res, 502, {
        ok: false,
        chyba: "Poštovní server zprávu nepřijal. Zkuste to později.",
      });
    }
  };
}
