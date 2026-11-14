import { otiskKodu } from "./odeslani.mjs";
import { zpravaChybyKatalogu, krokChybyKatalogu } from "./katalog-chyby.mjs";

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(JSON.stringify(data));
}

async function teloJson(req) {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers["content-type"] ?? "")) throw new Error("TELO");
  let velikost = 0;
  const casti = [];
  for await (const cast of req) {
    velikost += cast.length;
    if (velikost > 8192) throw new Error("TELO");
    casti.push(cast);
  }
  const data = JSON.parse(Buffer.concat(casti).toString("utf8"));
  if (!data || Array.isArray(data) || typeof data !== "object") throw new Error("TELO");
  return data;
}

/** Vrací false pro ostatní části existujícího API. Žádné CORS ani veřejné URL katalogu. */
export function vytvoritKatalogApi({ kody, planovac, origin = "https://nastroje.mujautoservis.eu", ted = Date.now }) {
  const pokusy = new Map();
  const neplatne = new Map();
  function limit(klic, maximum, mapa = pokusy) {
    const cas = ted();
    for (const [k, p] of mapa) if (p.do <= cas) mapa.delete(k);
    let p = mapa.get(klic);
    if (!p) {
      // Mapa nikdy neroste bez omezení ani při mnoha různých IP.
      if (mapa === neplatne && mapa.size >= 2048) return false;
      p = { do: cas + 3_600_000, pocet: 0 }; mapa.set(klic, p);
    }
    return ++p.pocet <= maximum;
  }
  return async (req, res) => {
    const cesta = (req.url ?? "").split("?")[0];
    if (!cesta.startsWith("/sestavy/api/katalog/")) return false;
    const odpoved = (status, data) => { json(res, status, data); return true; };
    const chyba = (status, text) => odpoved(status, { chyba: text });
    if (req.headers.origin && req.headers.origin !== origin) return chyba(403, "Nepovolený původ požadavku.");
    if (req.headers["sec-fetch-site"] === "cross-site") return chyba(403, "Nepovolený původ požadavku.");
    const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "").split(",").at(-1).trim();
    const kod = /^Bearer\s+(.+)$/i.exec(req.headers.authorization ?? "")?.[1] ?? "";
    if (!kod) return chyba(401, "V Nastavení vyplňte přístupový kód firmy.");
    const firma = kod.replace(/[\s\-‐-―]+/g, "").length >= 20 ? kody.get(otiskKodu(kod)) : undefined;
    if (!firma) return limit(`kod:${ip}`, 30, neplatne) ? chyba(401, "Přístupový kód firmy neplatí.") : chyba(429, "Příliš mnoho pokusů. Zkuste to za hodinu.");
    if (!limit(`firma:${firma}`, 1000)) return chyba(429, "Příliš mnoho požadavků firmy. Zkuste to za hodinu.");
    const pripraveno = !!planovac;
    if (cesta === "/sestavy/api/katalog/stav" && req.method === "GET")
      return odpoved(200, pripraveno ? { pripraveno, ...planovac.stav(firma) } : { pripraveno: false });
    if (!pripraveno) return chyba(503, "Serverové připojení této firmy ještě není nastavené. Obraťte se na správce.");
    if (req.method === "GET" && ["/sestavy/api/katalog/xml", "/sestavy/api/katalog/excel"].includes(cesta)) {
      const xml = cesta.endsWith("/xml");
      const vysledek = planovac.vysledek(firma, xml ? "xml" : "xlsx");
      if (!vysledek) return chyba(404, "Zatím není uložený žádný katalog.");
      res.writeHead(200, {
        "Content-Type": xml ? "application/xml; charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ic-office-skladovy-katalog.${xml ? "xml" : "xlsx"}"`,
        "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
      });
      res.end(vysledek); return true;
    }
    if (!["/sestavy/api/katalog/pripojit", "/sestavy/api/katalog/plan", "/sestavy/api/katalog/odpojit"].includes(cesta)) return chyba(404, "Nenalezeno.");
    if (req.method !== "POST") return chyba(405, "Nepovolená metoda.");
    let data;
    try { data = await teloJson(req); } catch { return chyba(400, "Neplatný nebo příliš velký požadavek."); }
    try {
      if (cesta.endsWith("/pripojit")) {
        const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
        if (Object.keys(data).some(k => !["email", "heslo", "souhlas"].includes(k)) || data.souhlas !== true || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof data.heslo !== "string" || !data.heslo || data.heslo.length > 1024)
          return chyba(400, "Vyplňte účet IC Office a potvrďte uložení připojení.");
        if (!limit(`pripojit:${firma}`, 5)) return chyba(429, "Příliš mnoho pokusů o připojení. Zkuste to za hodinu.");
        await planovac.pripojit(firma, { email, heslo: data.heslo });
      } else if (cesta.endsWith("/odpojit")) {
        if (Object.keys(data).length) return chyba(400, "Neplatný požadavek.");
        planovac.odpojit(firma);
      } else {
        if (Object.keys(data).length !== 1 || !("plan" in data)) return chyba(400, "Neplatný požadavek.");
        planovac.nastavitPlan(firma, data.plan);
      }
      return odpoved(200, { pripraveno: true, ...planovac.stav(firma) });
    } catch (e) {
      const kodChyby = e?.kod;
      if (kodChyby === "OBSAZENO") return chyba(409, "Katalog se právě načítá. Počkejte na dokončení.");
      if (kodChyby === "UCET") return chyba(409, "Účet nelze připojit k této firmě. Pro změnu účtu nejprve odpojte současné připojení; účet nesmí být připojený u jiné firmy.");
      if (["PLAN", "NEPRIPOJENO"].includes(kodChyby)) return chyba(400, "Zkontrolujte plán a připojení k IC Office.");
      const zprava = zpravaChybyKatalogu(kodChyby);
      if (zprava) {
        const krok = krokChybyKatalogu(e.krok);
        console.warn(JSON.stringify({ udalost: "katalog-chyba", kod: kodChyby, krok }));
        return odpoved(502, { chyba: `${zprava} Předchozí katalog zůstává zachovaný.`, kod: kodChyby, krok });
      }
      // Nevracet zprávy knihoven: mohou obsahovat přihlašovací údaje nebo odpověď IC Office.
      return chyba(502, "Připojení nebo načtení katalogu se nezdařilo. Zkontrolujte účet a přístup k IC Office. Předchozí katalog zůstává zachovaný.");
    }
  };
}
