import { Worker } from "node:worker_threads";

export function stahnoutNaPozadi({ prihlaseni, signal }, vytvoritWorker = (url, volby) => new Worker(url, volby)) {
  return new Promise((resolve, reject) => {
    const chyba = () => new Error("Načtení katalogu se nezdařilo.");
    if (signal?.aborted) { reject(chyba()); return; }
    const worker = vytvoritWorker(new URL("./katalog-worker.mjs", import.meta.url), {
      workerData: prihlaseni,
      resourceLimits: { maxOldGenerationSizeMb: 256, maxYoungGenerationSizeMb: 32, stackSizeMb: 4 },
    });
    let hotovo = false;
    async function dokoncit(vysledek) {
      if (hotovo) return;
      hotovo = true;
      clearTimeout(timer); signal?.removeEventListener("abort", zrusit);
      await worker.terminate().catch(() => {});
      try {
        if (!vysledek?.ok || signal?.aborted) throw chyba();
        resolve({ xml: vysledek.xml, xlsx: Buffer.from(vysledek.xlsx), polozky: vysledek.polozky, sklady: vysledek.sklady });
      } catch { reject(chyba()); }
    }
    const zrusit = () => { void dokoncit(null); };
    const timer = setTimeout(zrusit, 90_000);
    signal?.addEventListener("abort", zrusit, { once: true });
    worker.once("message", v => { void dokoncit(v); });
    worker.once("error", zrusit);
    worker.once("exit", zrusit);
    if (signal?.aborted) zrusit();
  });
}
