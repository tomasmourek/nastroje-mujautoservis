// Spuštění odesílací služby. Naslouchá jen na 127.0.0.1, zvenku je dostupná přes nginx (/sestavy/api/).
// Údaje ke společné adrese a otisky přístupových kódů jsou jen v proměnných prostředí
// kontejneru (Coolify), nikdy v repozitáři.
import { createServer } from "node:http";
import nodemailer from "nodemailer";
import { nacistKody, vytvoritObsluhu } from "./odeslani.mjs";
import { isAbsolute, join } from "node:path";
import { vytvoritKatalogApi } from "./katalog-api.mjs";

const {
  SMTP_HOST,
  SMTP_PORT = "587",
  SMTP_USER,
  SMTP_PASSWORD,
  MAIL_FROM,
  PRISTUPOVE_KODY,
} = process.env;

const kody = nacistKody(PRISTUPOVE_KODY);

// Volitelné serverové připojení. Částečná konfigurace nesmí předstírat funkční automat.
const { KATALOG_DATA_DIR, KATALOG_SIFROVACI_KLIC, KATALOG_ORIGIN } = process.env;
let planovac;
if (KATALOG_DATA_DIR || KATALOG_SIFROVACI_KLIC) {
  const klic = Buffer.from(KATALOG_SIFROVACI_KLIC ?? "", "base64");
  if (!KATALOG_DATA_DIR || !isAbsolute(KATALOG_DATA_DIR) || klic.length !== 32 || klic.toString("base64") !== KATALOG_SIFROVACI_KLIC)
    throw new Error("Neúplná konfigurace serverového katalogu.");
  const { otevritPlanovac } = await import("./katalog-planovac.mjs");
  const { stahnoutNaPozadi } = await import("./katalog-pozadi.mjs");
  const { platnyPlanSkladu, pristiTerminSkladu } = await import("./generated/katalog-format.mjs");
  planovac = await otevritPlanovac({
    cesta: join(KATALOG_DATA_DIR, "katalog.sqlite"), klic, firmy: new Set(kody.values()),
    platnyPlan: platnyPlanSkladu, pristiTermin: pristiTerminSkladu,
    stahnout: stahnoutNaPozadi,
  });
}
const katalog = vytvoritKatalogApi({ kody, planovac, origin: KATALOG_ORIGIN });

const posta =
  SMTP_HOST && MAIL_FROM
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        requireTLS: true,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
      })
    : null;

const obsluha = vytvoritObsluhu({
  kody,
  odeslat: posta ? (z) => posta.sendMail({ from: MAIL_FROM, ...z }) : null,
});

const server = createServer((req, res) => {
  (async () => { if (!(await katalog(req, res))) await obsluha(req, res); })().catch(() => {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  });
});
server.requestTimeout = 15_000;
server.listen(3000, "127.0.0.1", () =>
  console.log(
    JSON.stringify({
      udalost: "start",
      smtp: !!posta,
      kody: kody.size,
      katalog: !!planovac,
    }),
  ),
);

const tick = () => planovac?.tick().catch(() => console.error('{"udalost":"chyba-planovace-katalogu"}'));
const interval = planovac ? setInterval(tick, 15_000) : null;
void tick();
let konci = false;
async function ukoncit() {
  if (konci) return;
  konci = true;
  if (interval) clearInterval(interval);
  server.close();
  await planovac?.zavrit();
  posta?.close();
}
process.on("SIGTERM", ukoncit);
process.on("SIGINT", ukoncit);
