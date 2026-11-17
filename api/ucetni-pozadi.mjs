import { Worker } from "node:worker_threads";

const TEXTY = {
  IC_LOGIN: "IC Office nepotvrdil přihlášení.",
  IC_COMPANY: "Nelze ověřit shodu firmy IC Office.",
  IC_FORMAT: "IC Office nevrátil úplné a ověřitelné účetní podklady.",
  IC_NETWORK: "Načtení účetních podkladů z IC Office se nezdařilo.",
  IC_ABORTED: "Načítání účetních podkladů bylo přerušeno.",
  IC_RESTORE: "Nepodařilo se obnovit původní období v IC Office.",
  UCETNI_PODKLADY: "Účetní podklady nejsou úplné nebo nastavení není platné.",
  UCETNI_TIMEOUT: "Příprava účetních podkladů překročila povolenou dobu.",
  UCETNI_WORKER: "Přípravu účetních podkladů se nepodařilo dokončit.",
};

export class ChybaUcetnihoPozadi extends Error {
  constructor(code = "UCETNI_WORKER") {
    code = Object.hasOwn(TEXTY, code) ? code : "UCETNI_WORKER";
    super(TEXTY[code]); this.name = "ChybaUcetnihoPozadi"; this.code = code;
  }
}

// Jedna úloha běží v samostatném procesu V8. Zrušení se vrátí až po jeho ukončení,
// takže navazující úloha nemůže souběžně pokračovat se starou relací IC Office.
async function spustit(akce, data, { signal: signalVolani, workerUrl = new URL("./ucetni-worker.mjs", import.meta.url), timeoutMs = 300_000 } = {}) {
  const { signal: signalDat, ...vstup } = data ?? {};
  const signaly = [signalDat, signalVolani].filter(Boolean);
  if (signaly.some((s) => !(s instanceof AbortSignal))) throw new ChybaUcetnihoPozadi();
  if (signaly.some((s) => s.aborted)) throw new ChybaUcetnihoPozadi("IC_ABORTED");
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 300_000) throw new ChybaUcetnihoPozadi();
  let worker;
  try {
    worker = new Worker(workerUrl, {
      workerData: { akce, data: vstup }, execArgv: [], stdout: true, stderr: true,
      resourceLimits: { maxOldGenerationSizeMb: 512, maxYoungGenerationSizeMb: 16, stackSizeMb: 4 },
    });
    // Do provozních logů nesmí uniknout náhodná chyba knihovny s přihlašovacími údaji.
    worker.stdout.resume(); worker.stderr.resume();
  } catch { throw new ChybaUcetnihoPozadi(); }
  return new Promise((resolve, reject) => {
    let hotovo = false;
    const dokoncit = async (chyba, vysledek) => {
      if (hotovo) return;
      hotovo = true; clearTimeout(casovac);
      for (const s of signaly) s.removeEventListener("abort", prerusit);
      try { await worker.terminate(); }
      catch { chyba = new ChybaUcetnihoPozadi(); }
      if (chyba) reject(chyba); else resolve(vysledek);
    };
    const prerusit = () => { void dokoncit(new ChybaUcetnihoPozadi("IC_ABORTED")); };
    const casovac = setTimeout(() => { void dokoncit(new ChybaUcetnihoPozadi("UCETNI_TIMEOUT")); }, timeoutMs);
    worker.once("message", (zprava) => {
      if (zprava?.ok === true && Object.hasOwn(zprava, "vysledek")) void dokoncit(null, zprava.vysledek);
      else void dokoncit(new ChybaUcetnihoPozadi(zprava?.code));
    });
    worker.once("error", () => { void dokoncit(new ChybaUcetnihoPozadi()); });
    worker.once("exit", () => { void dokoncit(new ChybaUcetnihoPozadi()); });
    for (const s of signaly) s.addEventListener("abort", prerusit, { once: true });
    if (signaly.some((s) => s.aborted)) prerusit();
  });
}

export const overitFirmuNaPozadi = (data, options) => spustit("firma", data, options);
export const pripravitPodkladyNaPozadi = (data, options) => spustit("podklady", data, options);
