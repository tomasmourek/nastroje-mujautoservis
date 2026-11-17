// Vytvoří přístupový kód firmy pro odesílání účetní. Kód a aktivační odkaz zapíše jen do
// zadaného nového souboru, odkud je správce předá firmě; na výstup vypíše položku do
// PRISTUPOVE_KODY, která nese jen otisk. Použití: node server/novy-kod.mjs <firma> <soubor-pro-kod>
import { randomInt } from "node:crypto";
import { writeFileSync } from "node:fs";
import { otiskKodu } from "./odeslani.mjs";

// Bez snadno zaměnitelných znaků (0/O, 1/I/L); 25 znaků z 31 je přes 120 bitů náhody.
const ABECEDA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const [firma, soubor] = process.argv.slice(2);
if (!/^[a-z0-9-]{1,40}$/.test(firma ?? "") || !soubor) {
  console.error(
    "Použití: node server/novy-kod.mjs <firma: malá písmena, číslice, pomlčky> <soubor-pro-kod>",
  );
  process.exit(1);
}

const znaky = Array.from(
  { length: 25 },
  () => ABECEDA[randomInt(ABECEDA.length)],
).join("");
const kod = znaky.match(/.{5}/g).join("-");
// „wx“: existující soubor se nepřepíše. Odkaz kód po otevření uloží v prohlížeči firmy.
writeFileSync(
  soubor,
  `${kod}\nhttps://nastroje.mujautoservis.eu/sestavy/#kod=${kod}\n`,
  { flag: "wx", mode: 0o600 },
);
console.log(`${firma}:${otiskKodu(kod)}`);
