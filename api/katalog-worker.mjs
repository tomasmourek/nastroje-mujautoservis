import { parentPort, workerData } from "node:worker_threads";
import { stahnoutIcKatalog } from "./katalog-ic-office.mjs";
import { precistKatalog, pracovniGoogleXml } from "./generated/katalog-format.mjs";
import { ChybaKatalogu } from "./katalog-chyby.mjs";

// Síť i synchronní XLSX parser jsou mimo hlavní event loop. Nadřazený proces
// ukončí worker při timeoutu/odpojení; sem se nepředávají jiné účty ani šifrovací klíč.
try {
  const vysledek = await stahnoutIcKatalog({ prihlaseni: workerData }, { precistKatalog, pracovniGoogleXml });
  parentPort.postMessage({ ok: true, ...vysledek });
} catch (e) {
  parentPort.postMessage({ ok: false, code: e instanceof ChybaKatalogu ? e.code : "IC_WORKER", krok: e instanceof ChybaKatalogu ? e.krok : null });
}
