import { parentPort, workerData } from "node:worker_threads";

const KODY_IMPORTU = new Set(["IC_LOGIN", "IC_COMPANY", "IC_FORMAT", "IC_NETWORK", "IC_ABORTED", "IC_RESTORE"]);
let faze = "import";
try {
  const { akce, data } = workerData;
  if (!["firma", "podklady"].includes(akce)) throw new Error();
  const { overitIcFirmu, stahnoutUcetniPodklady } = await import("./ucetni-ic-office.mjs");
  const vstup = { ...data, signal: AbortSignal.timeout(190_000) };
  let vysledek;
  if (akce === "firma") vysledek = await overitIcFirmu(vstup);
  else {
    const { firma, soubory } = await stahnoutUcetniPodklady(vstup);
    faze = "podklady";
    const { pripravitAutomatickePodklady } = await import("./generated/accounting-format.mjs");
    vysledek = { ...await pripravitAutomatickePodklady({ soubory, nastaveni: data.nastaveni, obdobi: data.obdobi }), firma };
  }
  parentPort.postMessage({ ok: true, vysledek });
} catch (e) {
  const code = faze === "import" && KODY_IMPORTU.has(e?.code) ? e.code : faze === "podklady" ? "UCETNI_PODKLADY" : "UCETNI_WORKER";
  parentPort.postMessage({ ok: false, code });
}
