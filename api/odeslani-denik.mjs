// Deník uchovává pouze interní firmu a otisky ID/obsahu, nikdy adresy ani přílohy.
// Rozpracovaný či nejistý SMTP pokus nemá automatickou expiraci: po pádu procesu
// nelze dokázat, zda poštovní server zprávu přijal, a nový pokus by mohl zdvojit poštu.
import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, chmod } from "node:fs/promises";
import { dirname } from "node:path";

const otiskId = (id) => createHash("sha256").update(id).digest("hex");
const token = () => randomBytes(24).toString("hex");
function overit({ firma, id, otisk }) {
  if (typeof firma !== "string" || !/^[a-z0-9-]{1,80}$/.test(firma) ||
      typeof id !== "string" || !/^[\w:.-]{1,120}$/.test(id) ||
      typeof otisk !== "string" || !/^[a-f0-9]{64}$/.test(otisk))
    throw new Error("Neplatné označení odeslání.");
}

/** Pro místní obsluhu bez trvalého úložiště; produkce vkládá otevritDenikOdesilani. */
export function vytvoritPamatovyDenik() {
  const zaznamy = new Map();
  return {
    zahajit(v) {
      overit(v);
      const klic = `${v.firma}:${otiskId(v.id)}`;
      const predtim = zaznamy.get(klic);
      if (predtim) return { stav: predtim.otisk === v.otisk ? predtim.stav : "konflikt" };
      const t = token();
      zaznamy.set(klic, { otisk: v.otisk, stav: "probiha", token: t });
      return { stav: "nove", token: t };
    },
    dokoncit({ firma, id, token: t, stav }) {
      if (!["odeslano", "nejiste"].includes(stav)) throw new Error("Neplatný stav odeslání.");
      const z = zaznamy.get(`${firma}:${otiskId(id)}`);
      if (!z || z.token !== t || z.stav !== "probiha") throw new Error("Odeslání není rozpracované.");
      z.stav = stav;
    },
  };
}

/** Atomické zabrání odeslání platí i mezi procesy a po restartu. Soubor patří do soukromého svazku. */
export async function otevritDenikOdesilani({ cesta, ted = Date.now }) {
  await mkdir(dirname(cesta), { recursive: true, mode: 0o700 });
  await chmod(dirname(cesta), 0o700);
  const db = new DatabaseSync(cesta);
  try {
    await chmod(cesta, 0o600);
    db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS denik_odeslani (
        firma TEXT NOT NULL, id TEXT NOT NULL, otisk TEXT NOT NULL,
        stav TEXT NOT NULL CHECK(stav IN ('probiha','odeslano','nejiste')),
        token TEXT NOT NULL, vytvoreno INTEGER NOT NULL, dokonceno INTEGER,
        PRIMARY KEY(firma,id));`);
  } catch (e) { db.close(); throw e; }
  return {
    zahajit(v) {
      overit(v);
      const id = otiskId(v.id), t = token();
      // INSERT OR IGNORE je atomický i ve dvou nezávislých SQLite spojeních.
      const zapsano = db.prepare(`INSERT OR IGNORE INTO denik_odeslani
        (firma,id,otisk,stav,token,vytvoreno) VALUES (?,?,?,'probiha',?,?)`)
        .run(v.firma, id, v.otisk, t, ted());
      if (zapsano.changes) return { stav: "nove", token: t };
      const z = db.prepare("SELECT otisk,stav FROM denik_odeslani WHERE firma=? AND id=?").get(v.firma, id);
      return { stav: z.otisk === v.otisk ? z.stav : "konflikt" };
    },
    dokoncit({ firma, id, token: t, stav }) {
      if (!["odeslano", "nejiste"].includes(stav)) throw new Error("Neplatný stav odeslání.");
      const z = db.prepare(`UPDATE denik_odeslani SET stav=?,dokonceno=?
        WHERE firma=? AND id=? AND token=? AND stav='probiha'`)
        .run(stav, ted(), firma, otiskId(id), t);
      if (z.changes !== 1) throw new Error("Odeslání není rozpracované.");
    },
    zavrit: () => db.close(),
  };
}
