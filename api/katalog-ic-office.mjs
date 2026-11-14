// Každý běh používá vlastní přihlášení a cookie jar; relace prohlížeče se nepřebírá.
import { CookieJar } from "tough-cookie";
import { parseHTML } from "linkedom";

const PUVOD = "https://ic-office.eu";
const PRIHLASENI = `${PUVOD}/web/login`;
const KATALOG = `${PUVOD}/warehouse/goods-search`;
const EXPORT = `${PUVOD}/warehouse/?do=exportGoodsSearchExcel`;
const HTML_LIMIT = 4 * 1024 * 1024;
const XLSX_LIMIT = 50 * 1024 * 1024;
const LIMIT_BEHU = 90_000;
const PRESMEROVANI = new Set([301, 302, 303, 307, 308]);
const CESTY_PRIHLASENI = new Set(["/web/login", "/", "/overview/"]);
const ZPRAVY = {
  IC_LOGIN: "Přihlášení do IC Office selhalo. Ověřte přihlašovací údaje a oprávnění účtu.",
  IC_FORMAT: "IC Office nevrátil rozpoznaný úplný katalog nebo platný export XLSX.",
  IC_FILTER: "Katalog IC Office je filtrovaný. Vymažte hledání ve Sklady → Všechno zboží a opakujte načtení.",
  IC_NETWORK: "Spojení s IC Office selhalo. Opakujte načtení později.",
  IC_ABORTED: "Načtení katalogu IC Office bylo zrušeno nebo překročilo časový limit.",
};

class ChybaIc extends Error {
  constructor(code) {
    super(ZPRAVY[code]);
    this.code = code;
  }
}
const chyba = (code) => new ChybaIc(code);

function overitSignal(signal) {
  if (signal.aborted) throw chyba("IC_ABORTED");
}

// I testovací nebo nestandardní transport musí jít zrušit při čekání na hlavičky/tělo.
function prerusitelne(slib, signal) {
  overitSignal(signal);
  return new Promise((splnit, selhat) => {
    const zruseno = () => selhat(chyba("IC_ABORTED"));
    signal.addEventListener("abort", zruseno, { once: true });
    Promise.resolve(slib).then(splnit, selhat).finally(() => signal.removeEventListener("abort", zruseno));
  });
}

function zavritTelo(r) {
  if (r.body) void r.body.cancel().catch(() => {});
}

async function omezeneTelo(r, limit, signal) {
  const delka = r.headers.get("content-length");
  if (delka !== null && (!/^\d+$/.test(delka) || Number(delka) > limit)) {
    zavritTelo(r);
    throw chyba("IC_FORMAT");
  }
  if (!r.body) throw chyba("IC_FORMAT");
  const cteni = r.body.getReader();
  const casti = [];
  let velikost = 0;
  try {
    for (;;) {
      const { done, value } = await prerusitelne(cteni.read(), signal);
      overitSignal(signal);
      if (done) break;
      velikost += value.byteLength;
      if (velikost > limit) throw chyba("IC_FORMAT");
      casti.push(Buffer.from(value));
    }
    return Buffer.concat(casti, velikost);
  } finally {
    void cteni.cancel().catch(() => {});
    try { cteni.releaseLock(); } catch { /* Zrušené čekající čtení uvolní samotný stream. */ }
  }
}

async function dokument(r, signal) {
  const obsah = r.headers.get("content-type");
  if (obsah && !/^text\/html(?:\s*;|$)/i.test(obsah)) {
    zavritTelo(r);
    throw chyba("IC_FORMAT");
  }
  const obsahHtml = (await omezeneTelo(r, HTML_LIMIT, signal)).toString("utf8");
  try { return parseHTML(obsahHtml).document; } catch { throw chyba("IC_FORMAT"); }
}

function cilPrihlaseni(hodnota, zaklad = PRIHLASENI) {
  let url;
  try { url = new URL(hodnota, zaklad); } catch { throw chyba("IC_LOGIN"); }
  if (url.origin !== PUVOD || url.username || url.password || url.search || url.hash || !CESTY_PRIHLASENI.has(url.pathname)) throw chyba("IC_LOGIN");
  return url.href;
}

function polePrihlaseni(doc, prihlaseni) {
  const form = doc.querySelector("form#frm-loginForm");
  if (!form || (form.getAttribute("method") ?? "").toLowerCase() !== "post") throw chyba("IC_LOGIN");
  const akce = new URL(cilPrihlaseni(form.getAttribute("action") ?? ""));
  if (akce.href !== PRIHLASENI) throw chyba("IC_LOGIN");
  const jedine = (name) => {
    const pole = form.querySelectorAll(`[name="${name}"]`);
    if (pole.length !== 1) throw chyba("IC_LOGIN");
    return pole[0];
  };
  const email = jedine("email");
  const heslo = jedine("password");
  const token = jedine("_token_");
  const akceFormulare = jedine("_do");
  const odeslat = jedine("login");
  if (!["text", "email"].includes(email.getAttribute("type")) || heslo.getAttribute("type") !== "password"
    || token.getAttribute("type") !== "hidden" || akceFormulare.getAttribute("type") !== "hidden"
    || akceFormulare.getAttribute("value") !== "loginForm-submit"
    || !token.getAttribute("value") || token.getAttribute("value").length > 4096
    || odeslat.getAttribute("type") !== "submit" || odeslat.getAttribute("value") !== "Přihlásit") throw chyba("IC_LOGIN");
  // Neposíláme ostatní skrytá pole, případné cizí formy ani libovolné akce z HTML.
  return new URLSearchParams({ email: prihlaseni.email.trim(), password: prihlaseni.heslo,
    _token_: token.getAttribute("value"), _do: "loginForm-submit", login: "Přihlásit" });
}

function overitKatalog(doc) {
  if (doc.querySelector('input[type="password"]')) throw chyba("IC_LOGIN");
  const tabulka = doc.querySelector("#database_warehouse");
  const hledani = doc.querySelector('input#search[type="text"]');
  const norm = (s) => (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const sloupce = [...(tabulka?.querySelectorAll("thead th") ?? [])].map((h) => norm(h.textContent));
  if (!tabulka || !hledani || !["kod", "nazev", "mnozstvi", "sklad"].every((s) => sloupce.includes(s))) throw chyba("IC_FORMAT");
  if ((hledani.getAttribute("value") ?? "").trim()) throw chyba("IC_FILTER");
}

/** Přihlásí se samostatnou relací, ověří nefiltrovaný katalog před i po XLSX exportu. */
export async function stahnoutIcKatalog({ prihlaseni, signal: vnejsiSignal } = {}, { fetchImpl = fetch, precistKatalog, pracovniGoogleXml } = {}) {
  const cas = new AbortController();
  const casovac = setTimeout(() => cas.abort(), LIMIT_BEHU);
  casovac.unref?.();
  const signal = vnejsiSignal ? AbortSignal.any([vnejsiSignal, cas.signal]) : cas.signal;
  const cookies = new CookieJar();
  try {
    overitSignal(signal);
    if (!prihlaseni || typeof prihlaseni.email !== "string" || !prihlaseni.email.trim() || prihlaseni.email.length > 320
      || typeof prihlaseni.heslo !== "string" || !prihlaseni.heslo || prihlaseni.heslo.length > 4096) throw chyba("IC_LOGIN");
    if (typeof precistKatalog !== "function" || typeof pracovniGoogleXml !== "function") throw chyba("IC_FORMAT");

    const pozadavek = async (url, { method = "GET", body, login = false, exportXlsx = false } = {}) => {
      let cil = url;
      for (let pocet = 0; ; pocet++) {
        overitSignal(signal);
        const headers = { accept: exportXlsx ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/html" };
        const cookie = await cookies.getCookieString(cil);
        if (cookie) headers.cookie = cookie;
        if (body) {
          headers["content-type"] = "application/x-www-form-urlencoded";
          headers.origin = PUVOD;
          headers.referer = PRIHLASENI;
        }
        overitSignal(signal);
        const cekani = Promise.resolve(fetchImpl(cil, { method, body, headers, redirect: "manual", signal })).then((r) => {
          // Odpověď může dorazit až po zrušení čekání; ani její stream nesmí zůstat otevřený.
          if (signal.aborted) { zavritTelo(r); throw chyba("IC_ABORTED"); }
          return r;
        });
        const r = await prerusitelne(cekani, signal);
        if (signal.aborted) { zavritTelo(r); throw chyba("IC_ABORTED"); }
        // Transport nesmí sám skrytě následovat přesměrování s cookies nebo heslem.
        if (r.redirected || (r.url && r.url !== cil)) { zavritTelo(r); throw chyba(exportXlsx ? "IC_FORMAT" : "IC_LOGIN"); }
        const hlavicky = r.headers.getSetCookie?.() ?? (r.headers.get("set-cookie") ? [r.headers.get("set-cookie")] : []);
        for (const hodnota of hlavicky) await cookies.setCookie(hodnota, cil, { ignoreError: true });
        if (PRESMEROVANI.has(r.status)) {
          zavritTelo(r);
          if (exportXlsx) throw chyba("IC_FORMAT");
          if (!login || pocet >= 5) throw chyba("IC_LOGIN");
          const umisteni = r.headers.get("location");
          if (!umisteni) throw chyba("IC_LOGIN");
          cil = cilPrihlaseni(umisteni, cil);
          // Ani stejnému hostu neopakujeme heslo při 307/308; přihlášení může mít jen jednu POST akci.
          if (method === "POST" && [307, 308].includes(r.status)) throw chyba("IC_LOGIN");
          method = "GET";
          body = undefined;
          continue;
        }
        if (!r.ok) {
          zavritTelo(r);
          throw chyba(login || [401, 403].includes(r.status) ? "IC_LOGIN" : "IC_NETWORK");
        }
        return r;
      }
    };

    const vstup = await dokument(await pozadavek(PRIHLASENI, { login: true }), signal);
    const body = polePrihlaseni(vstup, prihlaseni);
    const poPrihlaseni = await dokument(await pozadavek(PRIHLASENI, { method: "POST", body, login: true }), signal);
    if (poPrihlaseni.querySelector('input[type="password"]')) throw chyba("IC_LOGIN");
    overitKatalog(await dokument(await pozadavek(KATALOG), signal));
    const r = await pozadavek(EXPORT, { exportXlsx: true });
    if (r.status !== 200) { zavritTelo(r); throw chyba("IC_FORMAT"); }
    const nazev = /(?:^|;)\s*filename="?([^";]+)/i.exec(r.headers.get("content-disposition") ?? "")?.[1];
    if (!nazev || !/\.xlsx$/i.test(nazev) || /[\\/\r\n]/.test(nazev)) { zavritTelo(r); throw chyba("IC_FORMAT"); }
    const xlsx = await omezeneTelo(r, XLSX_LIMIT, signal);
    if (xlsx.length < 4 || xlsx[0] !== 80 || xlsx[1] !== 75 || xlsx[2] !== 3 || xlsx[3] !== 4) throw chyba("IC_FORMAT");
    overitKatalog(await dokument(await pozadavek(KATALOG), signal));
    let polozky;
    let xml;
    try {
      polozky = precistKatalog(xlsx.buffer.slice(xlsx.byteOffset, xlsx.byteOffset + xlsx.byteLength));
      if (!Array.isArray(polozky)) throw chyba("IC_FORMAT");
      xml = pracovniGoogleXml(polozky);
      if (typeof xml !== "string") throw chyba("IC_FORMAT");
    } catch { throw chyba("IC_FORMAT"); }
    overitSignal(signal);
    return { xml, xlsx, polozky: polozky.length, sklady: new Set(polozky.map((p) => p.sklad)).size };
  } catch (e) {
    // Text odpovědi, token, cookies, heslo ani nízkoúrovňová síťová chyba nikdy neopouští adaptér.
    if (signal.aborted) throw chyba("IC_ABORTED");
    throw e instanceof ChybaIc ? e : chyba("IC_NETWORK");
  } finally {
    clearTimeout(casovac);
  }
}
