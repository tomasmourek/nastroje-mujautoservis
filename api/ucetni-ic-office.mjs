// Samostatná read-only relace. Exporty ani doklady se neposílají, nevytvářejí a nepřepisují.
import { CookieJar } from "tough-cookie";
import { parseHTML } from "linkedom";
import { prerusitelne, zavritTelo, omezeneTelo, dokument, cilPrihlaseni, polePrihlaseni } from "./katalog-ic-office.mjs";

const PUVOD = "https://ic-office.eu";
const LOGIN = `${PUVOD}/web/login`;
const PREHLED = `${PUVOD}/overview/`;
const FIRMA = `${PUVOD}/settings/company`;
const EXPORTY = ["exportInvoicesExcel", "exportInvoicesItemsExcel", "exportCashboxExcel", "exportGoodsImportExcel", "exportGoodsMinusExcel", "exportMechanicsItemsContracts"];
const MIB = 1024 * 1024;
const TEXTY = { IC_LOGIN: "IC Office nepotvrdil přihlášení.", IC_COMPANY: "Nelze ověřit shodu firmy IC Office.", IC_FORMAT: "IC Office nevrátil úplné a ověřitelné účetní podklady.", IC_NETWORK: "Načtení účetních podkladů z IC Office se nezdařilo.", IC_ABORTED: "Načítání účetních podkladů bylo přerušeno.", IC_RESTORE: "Nepodařilo se obnovit původní období v IC Office." };
export class ChybaUcetnihoImportu extends Error {
  constructor(code) { super(TEXTY[code] ?? TEXTY.IC_NETWORK); this.name = "ChybaUcetnihoImportu"; this.code = Object.hasOwn(TEXTY, code) ? code : "IC_NETWORK"; }
}
const chyba = (code = "IC_FORMAT") => new ChybaUcetnihoImportu(code);
const text = (n) => (n?.textContent ?? "").replace(/\s+/g, " ").trim();
const iso = (s) => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s) || s < "1900-01-01" || s > "2199-12-31") throw chyba();
  const datum = new Date(`${s}T12:00:00Z`);
  if (!Number.isFinite(datum.getTime()) || datum.toISOString().slice(0, 10) !== s) throw chyba();
  return s;
};
const datum = (s) => {
  const m = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})(?:\s.*)?$/.exec(s);
  if (!m) throw chyba();
  return iso(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`);
};
const cz = (s) => s.split("-").reverse().join(".");
function ico(s) {
  if (typeof s !== "string" || !/^\d{8}$/.test(s.trim())) throw chyba("IC_COMPANY");
  s = s.trim();
  const soucet = [...s.slice(0, 7)].reduce((n, c, i) => n + Number(c) * (8 - i), 0);
  if (s === "00000000" || Number(s[7]) !== (11 - soucet % 11) % 10) throw chyba("IC_COMPANY");
  return s;
}
const dom = (s) => parseHTML(/<html[\s>]/i.test(s) ? s : `<!doctype html><html><body>${s}</body></html>`).document;
const radky = (t) => [...t.querySelectorAll("tr")].filter((tr) => tr.closest("table") === t);
const bunky = (tr) => [...(tr?.children ?? [])].filter((n) => ["TD", "TH"].includes(n.tagName));

// Profil /settings/company je doložený existujícím doplňkem. IČO selector je NEOVĚŘENÝ ŽIVĚ;
// při jakékoli odchylce kontraktu se automat zastaví, žádný obecný selector klienta nepoužije.
function firmaZProfilu(doc, ocekavaneIco) {
  if (doc.querySelector('input[type="password"]')) throw chyba("IC_LOGIN");
  const forms = doc.querySelectorAll("form#frm-companyForm");
  let poleIco, poleNazev;
  if (forms.length === 1) {
    const i = forms[0].querySelectorAll('input[name="ico"]');
    const n = forms[0].querySelectorAll('input[name="nazev"]');
    if (i.length !== 1 || n.length !== 1) throw chyba("IC_COMPANY");
    [poleIco] = i; [poleNazev] = n;
  } else if (forms.length === 0) {
    const i = doc.querySelectorAll('input[id="frm-companyForm-ico"]');
    const n = doc.querySelectorAll('input[id="frm-companyForm-nazev"]');
    if (i.length !== 1 || n.length !== 1 || !i[0].closest("form") || i[0].closest("form") !== n[0].closest("form")) throw chyba("IC_COMPANY");
    [poleIco] = i; [poleNazev] = n;
  } else throw chyba("IC_COMPANY");
  const overeneIco = ico(poleIco.getAttribute("value") ?? "");
  const nazev = (poleNazev.getAttribute("value") ?? "").replace(/\s+/g, " ").trim();
  if (overeneIco !== ocekavaneIco || !nazev || nazev.length > 500) throw chyba("IC_COMPANY");
  return { ico: overeneIco, nazev };
}
function povolenaCesta(url, method) {
  const u = new URL(url);
  if (u.origin !== PUVOD || u.username || u.password || u.hash) return false;
  if ([LOGIN, PREHLED].includes(url)) return ["GET", "POST"].includes(method);
  if (url === FIRMA) return method === "GET";
  if (method !== "GET") return false;
  if (EXPORTY.some((e) => url === `${PREHLED}?do=${e}`) || url === `${PREHLED}?do=toggleLoad&ida=5`) return true;
  const keys = [...u.searchParams.keys()];
  return /^\/warehouse\/goods-move-list\/[1-9]\d*$/.test(u.pathname) && u.searchParams.get("is_list") === "True"
    && ((keys.length === 2 && u.searchParams.get("pdf") === "True" && keys.every((k) => ["pdf", "is_list"].includes(k))) || (keys.length === 1 && keys[0] === "is_list"));
}
function transport(fetchImpl, signal) {
  const jar = new CookieJar();
  return async function pozadavek(url, { method = "GET", body, ajax = false, pdf = false, aktivniSignal = signal } = {}) {
    if (aktivniSignal.aborted) throw chyba("IC_ABORTED");
    if (!povolenaCesta(url, method)) throw chyba();
    let cil = url;
    for (let n = 0; ; n++) {
      const headers = { accept: ajax ? "application/json" : "text/html,application/octet-stream" };
      if (ajax) headers["X-Requested-With"] = "XMLHttpRequest";
      const cookie = await jar.getCookieString(cil); if (cookie) headers.cookie = cookie;
      if (body) Object.assign(headers, { "content-type": "application/x-www-form-urlencoded", origin: PUVOD, referer: url === LOGIN ? LOGIN : PREHLED });
      const cekani = Promise.resolve().then(() => {
        if (aktivniSignal.aborted) throw chyba("IC_ABORTED");
        return fetchImpl(cil, { method, body, headers, redirect: "manual", signal: aktivniSignal });
      }).then((r) => {
        if (aktivniSignal.aborted) { zavritTelo(r); throw chyba("IC_ABORTED"); }
        return r;
      });
      const r = await prerusitelne(cekani, aktivniSignal);
      if (r.redirected || (r.url && r.url !== cil)) { zavritTelo(r); throw chyba(); }
      for (const c of r.headers.getSetCookie?.() ?? (r.headers.get("set-cookie") ? [r.headers.get("set-cookie")] : [])) await jar.setCookie(c, cil, { ignoreError: true });
      if ([301, 302, 303, 307, 308].includes(r.status)) {
        zavritTelo(r);
        const location = r.headers.get("location");
        if (!location || [307, 308].includes(r.status) || n >= 5) throw chyba("IC_LOGIN");
        if (url === LOGIN && method === "POST") {
          const u = new URL(location, cil);
          if (u.origin !== PUVOD || u.username || u.password) throw chyba("IC_LOGIN");
          return null; // Neopakovat heslo a nenásledovat úvodní stránku zvolenou účtem.
        }
        if (url === PREHLED && method === "POST") {
          if (cilPrihlaseni(location, cil, true) !== PREHLED) throw chyba();
          return null;
        }
        if (url !== LOGIN) throw chyba("IC_LOGIN");
        cil = cilPrihlaseni(location, cil, true); method = "GET"; body = undefined;
        continue;
      }
      if ((!r.ok || (method === "GET" && r.status !== 200)) && !(pdf && r.status === 500)) { zavritTelo(r); throw chyba([401, 403].includes(r.status) || url === LOGIN ? "IC_LOGIN" : "IC_NETWORK"); }
      return r;
    }
  };
}
async function relace({ prihlaseni, ocekavaneIco, signal: vnejsiSignal } = {}, { fetchImpl = fetch } = {}, akce) {
  const cas = new AbortController(), casovac = setTimeout(() => cas.abort(), 180_000); casovac.unref?.();
  const signal = vnejsiSignal ? AbortSignal.any([vnejsiSignal, cas.signal]) : cas.signal;
  try {
    const ocekavane = ico(ocekavaneIco);
    if (!prihlaseni || typeof prihlaseni.email !== "string" || !prihlaseni.email.trim() || prihlaseni.email.length > 320 || typeof prihlaseni.heslo !== "string" || !prihlaseni.heslo || prihlaseni.heslo.length > 4096) throw chyba("IC_LOGIN");
    const request = transport(fetchImpl, signal);
    const doc = await dokument(await request(LOGIN), signal);
    const r = await request(LOGIN, { method: "POST", body: polePrihlaseni(doc, prihlaseni) });
    if (r && (await dokument(r, signal)).querySelector('input[type="password"]')) throw chyba("IC_LOGIN");
    const overit = async () => firmaZProfilu(await dokument(await request(FIRMA), signal), ocekavane);
    const firma = await overit();
    return await akce({ request, signal, firma, overit });
  } catch (e) {
    throw chyba(e instanceof ChybaUcetnihoImportu && e.code === "IC_RESTORE" ? "IC_RESTORE" : signal.aborted ? "IC_ABORTED" : e instanceof ChybaUcetnihoImportu ? e.code : ["IC_LOGIN", "IC_FORMAT", "IC_ABORTED"].includes(e?.code) ? e.code : "IC_NETWORK");
  } finally { clearTimeout(casovac); }
}
export async function overitIcFirmu(options, deps) { return relace(options, deps, async ({ firma }) => firma); }

function obdobiZPrehledu(doc) {
  if (doc.querySelector('input[type="password"]')) throw chyba("IC_LOGIN");
  const forms = doc.querySelectorAll("form#frm-settingsForm");
  if (forms.length !== 1) throw chyba();
  const hodnoty = ["from", "to"].map((id) => {
    const pole = forms[0].querySelectorAll(`input[id="${id}"][name="${id}"]`);
    if (pole.length !== 1) throw chyba();
    const value = pole[0].getAttribute("value") ?? ""; datum(value); return value;
  });
  return { from: hodnoty[0], to: hodnoty[1] };
}
export async function stahnoutUcetniPodklady(options, deps) {
  const od = iso(options?.obdobi?.od), konec = iso(options?.obdobi?.do);
  if (od > konec) throw chyba();
  return relace(options, deps, async ({ request, signal, firma, overit }) => {
    let celkem = 0;
    const soubory = [], nazvy = new Set();
    const pridat = (nazev, bajty) => {
      celkem += bajty.length;
      if (celkem > 100 * MIB || nazvy.has(nazev)) throw chyba();
      nazvy.add(nazev); soubory.push({ nazev, data: Buffer.from(bajty).toString("base64") });
    };
    const puvodni = obdobiZPrehledu(await dokument(await request(PREHLED), signal));
    const nastavit = async (obdobi, aktivniSignal) => {
      const r = await request(PREHLED, { method: "POST", body: new URLSearchParams({ ...obdobi, settings: "Filtrovat", _do: "settingsForm-submit" }), aktivniSignal });
      if (r) zavritTelo(r);
      const skutecne = obdobiZPrehledu(await dokument(await request(PREHLED, { aktivniSignal }), aktivniSignal));
      if (datum(skutecne.from) !== datum(obdobi.from) || datum(skutecne.to) !== datum(obdobi.to)) throw chyba();
    };
    let neuspech = false, chybaImportu;
    try {
      await nastavit({ from: cz(od), to: cz(konec) }, signal);
      for (const typ of EXPORTY) {
        const r = await request(`${PREHLED}?do=${typ}`);
        const nazev = /(?:^|;)\s*filename="?([^";]+)/i.exec(r.headers.get("content-disposition") ?? "")?.[1];
        if (r.status !== 200 || !nazev || nazev.length > 240 || /[\\/:]/.test(nazev) || [...nazev].some((znak) => znak.charCodeAt(0) < 32 || znak.charCodeAt(0) === 127) || !nazev.endsWith(`_${od}_${konec}.xlsx`)) { zavritTelo(r); throw chyba(); }
        const data = await omezeneTelo(r, 50 * MIB, signal);
        if (data.length < 4 || !data.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4]))) throw chyba();
        pridat(nazev, data);
      }
      await skladovePodklady({ request, signal, od, konec, pridat });
    } catch (e) { neuspech = true; chybaImportu = e; }
    // I zrušený/částečně neúspěšný import obnoví filtr vlastní krátkou lhůtou.
    const obnova = new AbortController(), casovac = setTimeout(() => obnova.abort(), 10_000); casovac.unref?.();
    try { await nastavit(puvodni, obnova.signal); }
    catch { throw chyba("IC_RESTORE"); }
    finally { clearTimeout(casovac); }
    if (neuspech) throw chybaImportu;
    const aktualniFirma = await overit();
    if (aktualniFirma.nazev !== firma.nazev) throw chyba("IC_COMPANY");
    return { firma, soubory };
  });
}
async function skladovePodklady({ request, signal, od, konec, pridat }) {
  const r = await request(`${PREHLED}?do=toggleLoad&ida=5`, { ajax: true });
  let data;
  try { data = JSON.parse((await omezeneTelo(r, 4 * MIB, signal)).toString("utf8")); } catch { throw chyba(); }
  const html = data?.snippets?.["snippet--privy_prew"];
  if (typeof html !== "string") throw chyba();
  const tables = dom(html).querySelectorAll("table#datatable_information_vypriskl");
  if (tables.length !== 1 || !tables[0].querySelector("tbody")) throw chyba();
  const doklady = [], ids = new Set();
  for (const tr of tables[0].querySelectorAll("tbody tr")) {
    const td = bunky(tr);
    if (td.length === 1 && Number(td[0].getAttribute("colspan")) === 13 && !doklady.length && tables[0].querySelectorAll("tbody tr").length === 1) continue;
    if (td.length !== 13) throw chyba();
    const odkazy = [...td[12].querySelectorAll("a[href]")].filter((a) => /[?&]pdf=/.test(a.getAttribute("href") ?? ""));
    if (odkazy.length !== 1) throw chyba();
    const url = new URL(odkazy[0].getAttribute("href"), PUVOD);
    if (!povolenaCesta(url.href, "GET") || url.searchParams.get("pdf") !== "True") throw chyba();
    const id = url.pathname.split("/").at(-1), d = datum(text(td[1])), typ = text(td[11]), cislo = text(td[2]);
    if (d < od || d > konec || ids.has(id) || !cislo || !["Příjem", "Výdej", "Vratka ze zakázky / prodeje"].includes(typ)) throw chyba();
    ids.add(id);
    doklady.push({ pdf: { id, url: url.href }, d, typ, cislo, hodnoty: [text(td[0]), id, cislo, d, typ, ...td.slice(3, 11).map(text)] });
    if (doklady.length > 1000) throw chyba();
  }
  const bunka = (s) => /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  const hlavicka = ["#", "ID pohybu", "Číslo dokladu", "Datum", "Typ", "Klient", "Přidal / Vydal", "Název", "Zakázka", "Faktura", "Objednávka", "Hodnota [bez DPH]", "Hodnota [s DPH]"];
  pridat(`Prijemky_vydejky_${od}_${konec}.csv`, Buffer.from("\uFEFF" + [hlavicka, ...doklady.map((d) => d.hodnoty)].map((row) => row.map(bunka).join(";")).join("\r\n") + "\r\n"));
  for (const doklad of doklady) {
    const odpoved = await request(doklad.pdf.url, { pdf: true });
    if (odpoved.status === 500) {
      zavritTelo(odpoved);
      pridat(`Skladovy_doklad_${doklad.pdf.id}.html`, await tiskovyPodklad(doklad, request, signal));
    } else {
      const bajty = await omezeneTelo(odpoved, 10 * MIB, signal);
      if (bajty.length < 8 || bajty.subarray(0, 5).toString("ascii") !== "%PDF-") throw chyba();
      pridat(`Skladovy_doklad_${doklad.pdf.id}.pdf`, bajty);
    }
  }
}

async function tiskovyPodklad(r, request, signal) {
  const url = new URL(r.pdf.url);
  url.searchParams.delete("pdf");
  const odpoved = await request(url.href);
  const html = (await omezeneTelo(odpoved, 10 * MIB, signal)).toString("utf8");
  const doc = dom(html);
  const koreny = [...doc.body.children].filter((n) => n.tagName === "DIV");
  if (koreny.length !== 1) throw chyba();
  const koren = koreny[0];
  const nadpis = text(koren.firstElementChild);
  const ocekavanyNadpis = r.typ === "Výdej" ? "Skladová výdejka" : "Skladová příjemka";
  if (nadpis !== `${ocekavanyNadpis} č. ${r.cislo}`) throw chyba();
  const tabulky = [...koren.children].filter((n) => n.tagName === "TABLE");
  const hodnotyBunek = (tr) => bunky(tr).map(text);
  const polozky = tabulky.filter((t) => JSON.stringify(hodnotyBunek(radky(t)[0])) === JSON.stringify(["Název", "Kód", "Množství", "MJ", "J.Cena", "Cena", "%DPH", "DPH", "Celkem"]));
  if (polozky.length !== 1 || radky(polozky[0]).length < 2 || radky(polozky[0]).some((tr) => bunky(tr).length !== 9)) throw chyba();
  const datumRadky = tabulky.flatMap((t) => radky(t)).filter((tr) => text(bunky(tr)[0]) === "Datum příjemky/výdejky:");
  if (datumRadky.length !== 1 || datum(text(bunky(datumRadky[0])[1])) !== r.d) throw chyba();
  const soucty = tabulky.flatMap((t) => radky(t)).filter((tr) => bunky(tr).length === 9 && text(bunky(tr)[0]) === "Celkem");
  const castka = (s) => {
    const c = s.replace(/\s/g, "").replace(",", ".");
    if (!/^-?\d+(?:\.\d{1,2})?$/.test(c)) throw chyba();
    const halere = Math.round(Number(c) * 100);
    if (!Number.isSafeInteger(halere)) throw chyba();
    return halere;
  };
  if (soucty.length !== 1 || castka(text(bunky(soucty[0])[5])) !== castka(r.hodnoty[11]) || castka(text(bunky(soucty[0])[8])) !== castka(r.hodnoty[12])) throw chyba();
  const radkyPolozek = radky(polozky[0]).slice(1);
  // Zobrazené řádky jsou zaokrouhlené na haléře, patička vychází z přesnějších hodnot.
  const tolerance = Math.ceil(radkyPolozek.length / 2);
  for (const sloupec of [5, 7, 8]) {
    const soucet = radkyPolozek.reduce((s, tr) => s + castka(text(bunky(tr)[sloupec])), 0);
    if (Math.abs(soucet - castka(text(bunky(soucty[0])[sloupec]))) > tolerance) throw chyba();
  }
  // Rekonstrukce pouze textu a tabulek. Žádné původní atributy, skripty či vzdálené zdroje.
  const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const serializovat = (n) => {
    if (n.nodeType === 3) return escape(n.textContent ?? "");
    if (n.nodeType !== 1) return "";
    const tag = n.tagName.toLowerCase();
    if (["script", "style", "iframe", "object", "embed", "svg", "math", "template"].includes(tag)) return "";
    const obsah = [...n.childNodes].map(serializovat).join("");
    if (!["div", "p", "span", "b", "strong", "i", "em", "table", "thead", "tbody", "tfoot", "tr", "td", "th", "br"].includes(tag)) return obsah;
    if (tag === "br") return "<br>";
    let atributy = tag === "table" ? ' border="1"' : "";
    if (tag === "td" || tag === "th") for (const a of ["colspan", "rowspan"]) {
      const v = n.getAttribute(a);
      if (v && /^[1-9]\d{0,2}$/.test(v)) atributy += ` ${a}="${v}"`;
    }
    return `<${tag}${atributy}>${obsah}</${tag}>`;
  };
  return Buffer.from(`<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'"><title>Skladový doklad ${r.pdf.id}</title></head><body><p>Tiskový podklad z IC Office. Originální PDF není dostupné (HTTP 500). ID pohybu: ${r.pdf.id}.</p>${serializovat(koren)}</body></html>`);
}
