// Spuštění odesílací služby. Naslouchá jen na 127.0.0.1, zvenku je dostupná přes nginx (/sestavy/api/).
// Údaje ke společné adrese a otisky přístupových kódů jsou jen v proměnných prostředí
// kontejneru (Coolify), nikdy v repozitáři.
import { createServer } from "node:http";
import { vytvoritPostu } from "./smtp.mjs";
import { otevritDenikOdesilani } from "./odeslani-denik.mjs";
import { otevritUcetniPlanovac } from "./ucetni-planovac.mjs";
import { vytvoritUcetniApi } from "./ucetni-api.mjs";
import { overitFirmuNaPozadi, pripravitPodkladyNaPozadi } from "./ucetni-pozadi.mjs";
import { nacistKody, vytvoritObsluhu } from "./odeslani.mjs";
import { isAbsolute, join } from "node:path";
import { vytvoritKatalogApi } from "./katalog-api.mjs";
import { otevritUcty, vytvoritUcetApi } from "./katalog-ucty.mjs";

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
let ucty;
let denik;
let ucetniPlanovac;
let klic;
let kalendar;
if (KATALOG_DATA_DIR || KATALOG_SIFROVACI_KLIC) {
  klic = Buffer.from(KATALOG_SIFROVACI_KLIC ?? "", "base64");
  if (!KATALOG_DATA_DIR || !isAbsolute(KATALOG_DATA_DIR) || klic.length !== 32 || klic.toString("base64") !== KATALOG_SIFROVACI_KLIC)
    throw new Error("Neúplná konfigurace serverového katalogu.");
  const { otevritPlanovac } = await import("./katalog-planovac.mjs");
  const { stahnoutNaPozadi } = await import("./katalog-pozadi.mjs");
  const { platnyPlanSkladu, pristiTerminSkladu } = await import("./generated/katalog-format.mjs");
  kalendar = { platnyPlan: platnyPlanSkladu, pristiTermin: pristiTerminSkladu };
  // Trvalé samoobslužné identity se musí načíst před úklidem odebraných firem v plánovači.
  ucty = await otevritUcty({ cesta: join(KATALOG_DATA_DIR, "ucty.sqlite"), klic });
  planovac = await otevritPlanovac({
    cesta: join(KATALOG_DATA_DIR, "katalog.sqlite"), klic, firmy: new Set([...kody.values(), ...ucty.firmy()]),
    platnyPlan: platnyPlanSkladu, pristiTermin: pristiTerminSkladu,
    stahnout: stahnoutNaPozadi,
  });
  denik = await otevritDenikOdesilani({ cesta: join(KATALOG_DATA_DIR, "odeslani.sqlite") });
}

const posta =
  SMTP_HOST && MAIL_FROM
    ? vytvoritPostu({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        user: SMTP_USER, password: SMTP_PASSWORD, from: MAIL_FROM,
      })
    : null;

if (posta && planovac && denik) {
  const { overitAutomatickeNastaveni } = await import("./generated/accounting-format.mjs");
  ucetniPlanovac = await otevritUcetniPlanovac({
    cesta: join(KATALOG_DATA_DIR, "ucetni.sqlite"), klic, pripojeni: planovac, denik, ...kalendar,
    overitNastaveni: overitAutomatickeNastaveni, overitFirmu: overitFirmuNaPozadi,
    pripravit: pripravitPodkladyNaPozadi, odeslat: posta.odeslat,
  });
}
klic?.fill(0);

const ucet = vytvoritUcetApi({
  ucty, origin: KATALOG_ORIGIN,
  odeslat: posta?.odeslat,
  povolitFirmu: (firma) => planovac.povolitFirmu(firma),
});
const katalog = vytvoritKatalogApi({ kody, planovac, firmaRelace: ucet.firma, origin: KATALOG_ORIGIN,
  priOdpojeni: firma => { if (/^email-/.test(firma)) return ucetniPlanovac?.odpojit(firma); },
});
const ucetni = vytvoritUcetniApi({ planovac: ucetniPlanovac, firmaRelace: ucet.firma, origin: KATALOG_ORIGIN });

const obsluha = vytvoritObsluhu({
  kody,
  // Účetní podklady se bez trvalého deníku nikdy neposílají.
  odeslat: posta && denik ? posta.odeslat : null,
  denik,
});

const server = createServer((req, res) => {
  (async () => { if (!(await ucet.obsluha(req, res)) && !(await ucetni(req, res)) && !(await katalog(req, res))) await obsluha(req, res); })().catch(() => {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  });
});
server.requestTimeout = 15_000;
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Neplatný port služby.");
server.listen(port, "127.0.0.1", () =>
  console.log(
    JSON.stringify({
      udalost: "start",
      smtp: !!posta,
      kody: kody.size,
      katalog: !!planovac,
      ucetni: !!ucetniPlanovac,
      port: server.address().port,
    }),
  ),
);

const tick = () => {
  try {
    ucty?.uklid();
    ucty?.firemni?.uklid();
  } catch { console.error('{"udalost":"chyba-uklidu-prihlaseni"}'); }
  return Promise.allSettled([
    planovac?.tick().catch(() => console.error('{"udalost":"chyba-planovace-katalogu"}')),
    ucetniPlanovac?.tick().catch(() => console.error('{"udalost":"chyba-planovace-ucetni"}')),
  ]);
};
const interval = planovac ? setInterval(tick, 15_000) : null;
void tick();
let konci = false;
async function ukoncit() {
  if (konci) return;
  konci = true;
  if (interval) clearInterval(interval);
  const zavreno = new Promise(resolve => server.close(resolve));
  server.closeIdleConnections();
  await ucetniPlanovac?.zavrit();
  await planovac?.zavrit();
  await posta?.zavrit();
  // Probíhající ruční odeslání musí zapsat konečný/nejistý stav před zavřením SQLite.
  await zavreno;
  denik?.zavrit();
  ucty?.zavrit();
}
process.on("SIGTERM", ukoncit);
process.on("SIGINT", ukoncit);
export { server, ukoncit };
