import { Worker } from "node:worker_threads";
import { ChybaKatalogu } from "./katalog-chyby.mjs";

export function stahnoutNaPozadi({ prihlaseni, signal }, vytvoritWorker = (url, volby) => new Worker(url, volby)) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new ChybaKatalogu("IC_ABORTED")); return; }
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
        if (signal?.aborted) throw new ChybaKatalogu("IC_ABORTED");
        if (!vysledek?.ok) throw new ChybaKatalogu(vysledek?.code, vysledek?.krok);
        resolve({ xml: vysledek.xml, xlsx: Buffer.from(vysledek.xlsx), polozky: vysledek.polozky, sklady: vysledek.sklady });
      } catch (e) { reject(e instanceof ChybaKatalogu ? e : new ChybaKatalogu("IC_WORKER")); }
    }
    const zrusit = () => { void dokoncit({ ok: false, code: "IC_ABORTED" }); };
    const timer = setTimeout(zrusit, 90_000);
    signal?.addEventListener("abort", zrusit, { once: true });
    worker.once("message", v => { void dokoncit(v); });
    worker.once("error", () => { void dokoncit(null); });
    worker.once("exit", () => { void dokoncit(null); });
    if (signal?.aborted) zrusit();
  });
}
