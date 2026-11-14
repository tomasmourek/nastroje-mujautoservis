# nastroje-mujautoservis — serverové stahování skladového katalogu

Projekt: `nastroje-mujautoservis`. Větev: `codex/nastroje-mujautoservis-serverovy-katalog`. Datum: 2026-11-14.
Účel: příprava infrastruktury pro automatický export všech skladů z IC Office při vypnutém počítači. Jde o kandidáta, nikoli důkaz produkčního nasazení nebo připojení zákazníka.

## Převzatý zdroj a místní ověření

Zdrojový repozitář `ic-office-ucetni-sestavy`, commit `ba34083` (větev `codex/ic-office-ucetni-sestavy-automaticke-stahovani-katalogu`). Všech 67 souborů `sestavy/` odpovídá zdrojovému `dist/` podle SHA256, stejně jako devět runtime souborů API a sestavený `generated/katalog-format.mjs`. Zákaznické exporty, testovací databáze ani přihlašovací údaje se nepřebírají.

Zdrojové ověření: 225 aplikačních a 60 serverových testů prošlo, čtyři zákaznické testy bez podkladů byly přeskočené. Testy zahrnují všechny četnosti, obnovu SQLite, opakované souběžné spuštění, oddělení firem, selhání, opakování a odpojení během importu. Build prošel, lint nemá chyby a uvádí 10 dosavadních varování. Nezávislé read-only review uzavřelo nálezy po opravách; reviewer testy nespouštěl.

Prohlížeč se simulovaným API místně ověřil připojení se souhlasem, vymazání hesla, denní/týdenní/měsíční plán a obnovení stránky, stažení XML i Excelu, zastavení a odpojení. Šířky 1440 a 375 px nemají vodorovný přesah. Scénář je ve zdroji `overeni/ic-office-ucetni-sestavy-serverovy-katalog.js`. Jde o test rozhraní se syntetickými daty, nikoli přihlášení do IC Office nebo automatický produkční export.

## Obraz a služby

Obě fáze Dockerfile používají `node:24-alpine`; finální obraz přidává nginx a su-exec. Build kontroluje dostupnost `node:sqlite` otevřením databáze v paměti. Balíčky API jsou instalované z `api/package-lock.json` přes `npm ci --omit=dev`. Runtime a lockfile se přebírají ze zdrojového `ic-office-ucetni-sestavy/server/`, včetně sestaveného `generated/katalog-format.mjs`; v tomto repozitáři se logika katalogu neupravuje.

Nginx poslouchá na portu 80, API pouze na `127.0.0.1:3000`. Stávající statické cesty, bezpečnostní hlavičky, limit těla 28 MB a SMTP zůstávají zachované. Čekání proxy je 120 sekund, aby se dokončil nejvýše 90sekundový import. API běží jako `nginx`, s `umask 077`; při pádu je supervisor po pěti sekundách znovu spustí. Kontejner předává ukončení API i nginx. Soukromé soubory, pracovní checkouty a závislosti se vylučují z Docker build contextu.

## Povinné nastavení před aktivací

V existující aplikaci Coolify nastavte trvalý svazek s cílem **`/var/lib/ic-office-katalog`**. Použijte jeden stabilní pojmenovaný svazek při každém nasazení a zachovejte jej při rollbacku. Pouhý adresář v obrazu ani instrukce Docker `VOLUME` nenahrazují explicitní připojení svazku v Coolify. Bez něj by nové nasazení ztratilo plán i data. Spouštěcí skript připraví pouze tuto pevnou cestu s vlastníkem `nginx:nginx` a oprávněním `0700`; jinou hodnotu `KATALOG_DATA_DIR` odmítne.

Proměnné prostředí patří pouze do runtime konfigurace Coolify, nikoli do veřejného repozitáře nebo build arguments:

| Proměnná | Hodnota a účel |
| --- | --- |
| `KATALOG_DATA_DIR` | `/var/lib/ic-office-katalog` |
| `KATALOG_SIFROVACI_KLIC` | Náhodný 32bajtový klíč v kanonickém Base64, uložený jako tajemství. |
| `KATALOG_ORIGIN` | Volitelné; výchozí `https://nastroje.mujautoservis.eu`. Měnit pouze pro oddělené testovací prostředí. |

Stávající `PRISTUPOVE_KODY` a SMTP proměnné se zachovávají. Při neúplné konfiguraci se API nespustí. Bez katalogové konfigurace ostatní API funguje a panel pravdivě hlásí, že automat není připravený. Uživatel s přístupovým kódem firmy sám zadá e-mail a heslo svého účtu IC Office do zabezpečeného formuláře a po ověření zapne plán. Stejný přihlašovací účet nesmí být připojen více firmám; vazbu hlídá databáze. Předpřiřazení e-mailu provozovatelem ani `KATALOG_UCTY` se nepoužívá. Heslo nesmí být v dokumentaci, chatu ani logu.

Před aktivací určete zálohování celého svazku, retenční dobu a vlastníka obnovy. SQLite zálohujte konzistentně (např. při zastaveném API), ne samotným kopírováním otevřeného souboru bez WAL. Šifrovací klíč zálohujte bezpečně odděleně od databáze; bez původního klíče uložené připojení nelze obnovit. Přihlašovací údaje jsou šifrované, poslední katalog XML/Excel nemá další aplikační šifrování a chrání jej soukromý svazek a autorizované API. Odpojení maže aktivní připojení, plán a poslední katalog; dřívější provozní zálohy mají vlastní retenční dobu.

## Přejímka

Build a API jsou převzaté. Před vydáním sestavte obraz a ověřte `node --version`, dostupnost `node:sqlite`, `nginx -t`, odpověď rozcestníku a stávající API. Pro reálnou přejímku dále proveďte:

1. Připojení schválené firmy vlastním účtem IC Office, první export všech skladů a porovnání počtů i obsahu s ručním exportem.
2. Denní, týdenní a měsíční plán v časové zóně Europe/Prague, včetně splatného běhu při zavřených prohlížečích a vypnutém uživatelském počítači.
3. Restart kontejneru se stejným svazkem a klíčem: zachovaný plán a poslední výsledek, žádné zdvojení splatného termínu.
4. Chybné přihlášení ponechá poslední úspěšný katalog; firma s jiným přístupovým kódem jej nemůže stáhnout. Odpojení odstraní aktivní data a zastaví další běhy.

Místní kontrola 2026-11-14: syntaxe obou spouštěcích skriptů prošla `bash -n`, všechny moduly API a formatter prošly `node --check`, `git diff --check` je bez chyb. Čistá instalace API z lockfile prošla na Node.js 24.22.1 přes `npm ci --omit=dev --offline --ignore-scripts --no-audit --no-fund`; předchozí síťový pokus v sandboxu nedokázal přeložit `cdn.sheetjs.com`. Docker CLI je nainstalované, ale daemon není dostupný (`dockerDesktopLinuxEngine` chybí). Sestavení obrazu, skutečný běh nginx/Node v kontejneru, persistentní svazek, záloha/obnova ani produkční přejímka tím nejsou ověřené. Zdrojové testy plánovače nenahrazují tyto provozní kontroly. XML zůstává pracovní do doplnění odkazů, obrázků a prodejních údajů e-shopu.
