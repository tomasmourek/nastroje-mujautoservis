import { ChybaUcetnihoPlanovace } from "./ucetni-planovac.mjs";

const LIMIT_TELA = 256 * 1024;
const STATUS_CHYBY = Object.freeze({ PLAN: 400, PRIPOJENI: 400, FIRMA: 409, IMPORT: 502, NEJISTE: 409, OBSAZENO: 409, ULOZISTE: 503 });

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(JSON.stringify(data));
}

function teloJson(req) {
  const odlozitZbytek = () => { req.once("error", () => {}); req.resume(); };
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers["content-type"] ?? "")) { odlozitZbytek(); return Promise.reject(new Error("TELO")); }
  if (Number(req.headers["content-length"]) > LIMIT_TELA) { odlozitZbytek(); return Promise.reject(new Error("TELO")); }
  return new Promise((resolve, reject) => {
    let velikost = 0;
    const casti = [];
    function uklidit() { req.off("data", data); req.off("end", konec); req.off("error", chyba); req.off("aborted", chyba); }
    function chyba() { uklidit(); odlozitZbytek(); reject(new Error("TELO")); }
    function data(cast) {
      velikost += cast.length;
      if (velikost > LIMIT_TELA) return chyba();
      casti.push(cast);
    }
    function konec() {
      uklidit();
      try {
        const hodnota = JSON.parse(Buffer.concat(casti).toString("utf8"));
        if (!hodnota || Array.isArray(hodnota) || typeof hodnota !== "object") throw new Error("TELO");
        resolve(hodnota);
      } catch { reject(new Error("TELO")); }
    }
    req.on("data", data); req.on("end", konec); req.on("error", chyba); req.on("aborted", chyba);
  });
}

/** Jen ověřená e-mailová relace katalogu. Aktivace ukládá plán; sama nic neodesílá. */
export function vytvoritUcetniApi({ planovac, firmaRelace, origin = "https://nastroje.mujautoservis.eu", ted = Date.now }) {
  const firmy = new Map(), neplatne = new Map();
  function zaznam(mapa, klic) {
    const cas = ted();
    for (const [k, p] of mapa) if (p.do <= cas) mapa.delete(k);
    let p = mapa.get(klic);
    if (!p) {
      if (mapa.size >= 2048) return null;
      p = { do: cas + 3_600_000, pozadavky: 0, aktivace: 0 };
      mapa.set(klic, p);
    }
    return p;
  }
  return async (req, res) => {
    const cesta = (req.url ?? "").split("?")[0];
    if (!cesta.startsWith("/sestavy/api/ucetni/")) return false;
    const odpoved = (status, data) => { json(res, status, data); return true; };
    const chyba = (status, text) => odpoved(status, { chyba: text });
    if ((req.headers.origin && req.headers.origin !== origin) || req.headers["sec-fetch-site"] === "cross-site") return chyba(403, "Nepovolený původ požadavku.");
    const stav = cesta === "/sestavy/api/ucetni/stav";
    if (!stav && !["/sestavy/api/ucetni/plan", "/sestavy/api/ucetni/zastavit"].includes(cesta)) return chyba(404, "Nenalezeno.");
    if (req.method !== (stav ? "GET" : "POST")) return chyba(405, "Nepovolená metoda.");
    if (!stav && req.headers.origin !== origin) return chyba(403, "Nepovolený původ požadavku.");
    let firma;
    try {
      // Starý kód firmy nesmí aktivovat nový automat ani obejít vazbu relace a účtu.
      if (req.headers.authorization === undefined && typeof req.headers["x-katalog-ucet"] === "string") firma = firmaRelace?.(req);
    } catch { return chyba(503, "Přihlášení nyní nelze ověřit. Zkuste to později."); }
    if (typeof firma !== "string" || !/^email-[a-f0-9]{32}$/.test(firma) || req.headers["x-katalog-ucet"] !== firma) {
      const pokus = zaznam(neplatne, req.socket.remoteAddress ?? "");
      return pokus && ++pokus.pozadavky <= 30
        ? chyba(401, "Přihlaste se e-mailem v Exportu skladového katalogu.")
        : chyba(429, "Příliš mnoho pokusů. Zkuste to za hodinu.");
    }
    const limit = zaznam(firmy, firma);
    if (!limit || ++limit.pozadavky > 1000) return chyba(429, "Příliš mnoho požadavků účtu. Zkuste to za hodinu.");
    if (!planovac) return stav ? odpoved(200, { pripraveno: false }) : chyba(503, "Serverové odesílání účetní ještě není nastavené. Obraťte se na správce.");
    try {
      if (!stav) {
        let data;
        try { data = await teloJson(req); } catch { return chyba(400, "Neplatný nebo příliš velký požadavek."); }
        if (cesta.endsWith("/plan")) {
          if (Object.keys(data).length !== 3 || !Object.hasOwn(data, "plan") || !Object.hasOwn(data, "nastaveni") || data.souhlas !== true) return chyba(400, "Potvrďte uložení nastavení a automatické odesílání vybraných příloh.");
          if (++limit.aktivace > 5) return chyba(429, "Příliš mnoho pokusů o aktivaci plánu. Zkuste to za hodinu.");
          await planovac.nastavitPlan(firma, data);
        } else {
          if (Object.keys(data).length) return chyba(400, "Neplatný požadavek.");
          await planovac.zastavit(firma);
        }
      }
      return odpoved(200, { ...await planovac.stav(firma), pripraveno: true });
    } catch (e) {
      if (e instanceof ChybaUcetnihoPlanovace && Object.hasOwn(STATUS_CHYBY, e.kod))
        return odpoved(STATUS_CHYBY[e.kod], { kod: e.kod, chyba: new ChybaUcetnihoPlanovace(e.kod).message });
      // Zprávy knihoven a odpovědi IC Office mohou obsahovat tajemství.
      return chyba(503, "Serverové odesílání nyní nelze dokončit. Obnovte stav; před opakováním ověřte výsledek.");
    }
  };
}
