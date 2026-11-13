# nastroje-mujautoservis — projektová mapa

## Kandidát serverového stahování katalogu — 2026-11-14

- Větev `codex/nastroje-mujautoservis-serverovy-katalog`, základ `d31b096`: příprava Node.js 24 se SQLite, nginx a pevného adresáře `/var/lib/ic-office-katalog`. API proxy čeká nejvýše 120 sekund; SMTP a veřejné cesty zůstávají zachované.
- Před aktivací je nutný explicitní trvalý svazek v Coolify a šifrovací klíč. Uživatel s přístupovým kódem firmy si pak sám připojí svůj účet IC Office a zapne plán. Stejný účet nelze připojit více firmám. Bez konfigurace automat neběží. Zdrojový build/API se přebírají samostatně; tato příprava není produkční nasazení.
- Docker daemon na hostiteli není dostupný; kontejner, obnova svazku ani skutečný automatický import dosud nejsou ověřené. [Konfigurace, přejímka a hranice důkazů](docs/nastroje-mujautoservis-serverovy-katalog-2026-11-14.md).

## Nasazení 0.6.0 — export skladového katalogu — 2026-11-13

- Zdroj `ic-office-ucetni-sestavy` `c9f5920` začleněn PR #11 (merge `6729486`). Nová sekce Export skladového katalogu (`#google-sklady`): XML katalog všech skladů a nastavení denního, týdenního a měsíčního běhu. Plán se zatím ukládá jen místně, automatizace není aktivní.
- Claude Code začlenil nasazovací PR #13; Coolify nasadil commit `adb131e`, stav `finished` v 22:26:48 UTC. Ruční i následný skutečný import doplňkem 0.6.0 a stažení XML na produkci: 3 103 položek, 18 skladů, 3 053 kódů; všechna exportovaná pole a součty odpovídají zdroji. Opakování obou způsobů importu nezměnilo počty ani hash XML; všechny čtyři stažené XML jsou bajtově shodné. Denní, týdenní a měsíční nastavení přetrvalo obnovení stránky, 31. den se v listopadu správně omezil na 30. Automatický běh není implementovaný; Firefox a Edge v této etapě nebyly samostatně živě testovány.
- `sestavy/` odpovídá zdrojovému `dist/` (67/67 souborů podle SHA256). Zdroj: 225 testů prošlo, 4 přeskočeny, lint bez chyb, build prošel. [Důkazy a omezení produkčního ověření](docs/nastroje-mujautoservis-export-skladoveho-katalogu-2026-11-13.md).

## Nasazení instalačního panelu doplňku — 2026-11-13

- Claude Code začlenil zdrojové PR #10 a nasazovací PR #11 do `prvni-verze`. Coolify nasadil merge `5e3b36b`, deployment `afzewzgngqhqa0skocd1csae` skončil úspěšně ve 20:58:14 UTC. Produkční HTML, hlavní JavaScript, CSS a ZIP odpovídají kandidátu podle SHA256.
- Na produkci byly v integrovaném prohlížeči ověřeny všechny tři varianty panelu (Chrome, Edge, Firefox), jejich ruční návody a skutečné stažení ZIPu 0.5.3. Nejde o test tří samostatných enginů. Vydavatelské účty ani zveřejněné odkazy dosud nejsou, instalace z obchodů není dostupná.
- Zdroj: 193 testů prošlo, čtyři bez zákaznických dat přeskočeny, TypeScript a build prošly. Místní Chrome ověřil volbu všech tří návodů a stažení ZIPu. Všech 67 souborů kandidáta odpovídá zdrojovému `dist/` podle SHA256. [Podrobnosti a hranice ověření](docs/nastroje-mujautoservis-instalace-doplnku-2026-11-13.md).

## Aktuální checkpoint vydání 0.5.3 — 2026-11-13

- Produkční 0.5.3 je nasazena z `98c6e2b`; Coolify dokončil nasazení v 19:31:19 UTC. Veřejný JavaScript i ZIP odpovídají kandidátu podle SHA256.
- Skutečné A (říjen) → B (11.–12.11.) → B v Chrome prošlo bez ruční změny zapamatované stránky 17. Sedm sestav se při stejném filtru přesně shoduje; v IC Office zůstalo pět stejných dokladů bez duplicit. Stažený ZIP obsahuje pět PDF a správný souhrn dvou příjemek a tří výdejek pouze za B. Lokálně 183 testů a build prošly; nezávislé review Claude Code bez nálezů, 61 cílených testů úspěšných.
- Firefox a Edge samostatně neověřeny. Podrobnosti: [evidence vydání](docs/nastroje-mujautoservis-podpora-firefox-2026-11-13.md). Starší oddíly níže zachycují předchozí etapy.

Projekt: nastroje-mujautoservis. Větev: `prvni-verze`. Datum: 2026-11-03.
Účel: rozcestník projektu, doložený stav a další ověřitelný výsledek.

## Identita a umístění

- Produkt, publikum, doména: rozcestník nástrojů pro autoservisy; majitelé a účetní autoservisů. Doména `https://nastroje.mujautoservis.eu` (wildcard DNS `*.mujautoservis.eu` → Netcup).
- Remote a checkout: `C:\Projekty\nastroje-mujautoservis`, veřejný GitHub `tomasmourek/nastroje-mujautoservis` (zveřejněn 2026-11-03 na pokyn uživatele, aby jej Coolify stahoval bez klíče; obsahuje jen veřejně servírované soubory).
- Nasazení: Coolify na Netcupu, projekt `nastroje-mujautoservis`, aplikace `nastroje-mujautoservis` (Public Git Repository, větev `prvni-verze`, Dockerfile, port 80). Automatické nasazení po pushi není nastavené; nasazuje se tlačítkem Deploy.
- Vztahy: pod `/sestavy/` se nasazuje build repozitáře `ic-office-ucetni-sestavy`. Odkazuje na archiv.mujautoservis.eu, mujkalendar.eu, mojerezervace.eu a mojefaktura.eu. Vzhled podle úvodní stránky archiv.mujautoservis.eu (od 2026-11-03), přepínání motivu z `atomys-design-system` 2.1.0.

## Produkt

- Rozhodnuto uživatelem: publikum autoservisy; obecné nástroje a atomys.eu jen jako odkaz; samostatný repozitář (původně soukromý, 2026-11-03 zveřejněn); nejdřív náhled, nasazení po schválení (schváleno 2026-11-03).
- Hypotézy: zájem servisů o bezplatné nástroje; formulace přínosů čekají na schválení.

## Aktuální stav

- Etapa: první veřejná verze nasazená na produkci.
- Ověřeno lokálně 2026-11-03: stránka bez chyb v konzoli, na 375 px bez vodorovného přetečení, mobilní nabídka se otevírá, odkaz `sestavy/#nacteni` načte aplikaci a ukázková data; řádek faktury 2026102 v sestavě odpovídá číslům na stránce.
- Otevřené: živé ověření informací o úložišti; automatické nasazení po pushi.

## Důkazy a vydání

- Kandidát opravy 2026-11-05: sestavy a API obsahují ochranu neověřeného automatického odeslání, přístupový kód v `sessionStorage` pro relaci panelu místo `localStorage` (při obnovení relace prohlížeče může zůstat dostupný) a povinné TLS pro SMTP. Změny jsou připravené lokálně; nasazení ani živé ověření tím není doložené. Zdroj a regresní testy jsou v repozitáři `ic-office-ucetni-sestavy`.
- Nezávislé review: neproběhlo.
- Živý smoke test 2026-11-03 (commit 2aa80b8): `/`, `/sestavy/` a assety vrací 200, HTTP přesměruje na HTTPS, certifikát Let's Encrypt platný do 2027-02-01, bezpečnostní hlavičky z `deploy/nginx.conf` přítomné; ukázková data se v živé aplikaci načtou bez chyb v konzoli a řádek faktury 2026102 za říjen 2026 odpovídá stránce. Ostatní domény sdíleného serveru odpovídaly 200.

## Oprava načítání období 2026-11-13

- Pracovní větev: `codex/nastroje-mujautoservis-oprava-obdobi`, základ `7904e2d`. Zdroj sestav: `ic-office-ucetni-sestavy`, commit `db6dbaf9aa0707e27fdd630749fea7c43c482a18`.
- Změna období importu odstraní dosud načtené exporty a filtr sestav. Každé načtení přes doplněk nahrazuje celou dávku; opožděná starší odpověď se ignoruje. Návrat ze sestav zachová zvolené období, ruční přidávání souborů zůstává zachováno.
- Build nahrazen ve složce `sestavy/`; všech 67 souborů odpovídá SHA256 zdrojového `dist/`. API a doplněk se nemění.
- Lokální ověření: 58 testů prošlo, 4 zákaznické testy bez externích dat přeskočeny; TypeScript a Vite build prošly. Osm regresních scénářů nad sestavenou verzí prošlo bez chyby prohlížeče. Původní build v regresním průchodu selhal. Scénář je ve zdrojovém repozitáři: `overeni/ic-office-ucetni-sestavy-nacitani-obdobi.js`.
- Regresní ověření před vydáním použilo simulovaný most doplňku a syntetické CSV. Následné skutečné ověření produkce je popsáno níže; nezávislé review této opravy neproběhlo.
- Následné vydání 2026-11-13: obě PR č. 2 začleněna, zdroj `864509b`, nasazení `0c5b714`. Coolify dokončil rolling aktualizaci produkce; všech 67 živých souborů odpovídá Git objektům nasazeného commitu. Živé ověření potvrdilo vymazání exportů ruční i rychlou změnou období, odstranění staré sestavy a zachování dat při opakování stejného období. Po přihlášení byl skutečným doplňkem dokončen import 01.–31.10.2026 → 01.–12.11.2026. Zůstalo jen šest listopadových exportů a čtyři listopadové faktury, žádná z deseti říjnových; kontrolováno přes celé načtené období. Říjnové pokladní doklady také zmizely. Podrobnosti a omezení: [nasazení a ověření opravy období](docs/nastroje-mujautoservis-nasazeni-opravy-obdobi-2026-11-13.md).
- Opakovaný skutečný import 01.–12.11.2026 přes doplněk na produkci 2026-11-13: zůstalo šest jedinečných souborů, čtyři faktury a stejné počty ostatních záznamů. Tabulky včetně částek a součtů i obsah všech sedmi obrazovek sestav se před importem a po něm shodovaly; kontrolováno přes celé načtené období. Ke zdvojení nedošlo. Prázdná pokladna a pracovníci zůstali prázdní; generování a odeslání exportů nebylo součástí ověření. Důkaz je ve stejné dokumentaci nasazení.

## Podpora Firefoxu 2026-11-13

- Kandidát doplňku 0.4.0 pro Firefox 140+, Chrome a Edge; bez rozšíření oprávnění. Lokálně prošlo 81 testů (4 přeskočeny), build a osm regresních scénářů se syntetickými daty. Nezávislé review vedlo k upřesnění aktualizace: starou verzi nejprve odebrat.
- Verze 0.4.0 nasazena z commitu `ff15b25832bf75f53a23158689e639f73fae7cf5`; Coolify potvrdil Success a dokončení aktualizace 2026-11-13 v 16:12:18 UTC. Veřejná stránka vrací HTTP 200, hlavní JavaScript a ZIP odpovídají kandidátu podle SHA256. Skutečný průchod v Chrome s doplňkem 0.4.0: říjen → 12. listopadu → opět 12. listopadu. Původní data zmizela, zůstalo šest jedinečných souborů a jedna listopadová faktura. Po opakování se při stejném filtru přesně shodoval obsah všech sedmi obrazovek sestav. Firefox má připravenou dočasnou nepodepsanou instalaci; skutečné ověření čeká na ruční test uživatele, protože ovládání blokuje politika nástroje. Edge nebyl samostatně živě testován. Evidence a omezení: [podpora Firefoxu](docs/nastroje-mujautoservis-podpora-firefox-2026-11-13.md).

### Vydání 0.5.0 — skladové doklady

- Ruční test Firefoxu 0.4.0 selhal na `constructor`; kandidát opravuje binární přenos. Přidává původní PDF příjemek/výdejek, souhrny a ZIP pro účetní, volitelné vystavení chybějících dokladů s ochranou proti opakovanému zápisu. Podklady jsou jen v paměti; technické ID nepotvrzeného zápisu zůstává na ic-office.eu do potvrzení PDF.
- Zdroj `2581e1a`, pracovní větev `codex/ic-office-ucetni-sestavy-podpora-firefox`. 144 testů prošlo, 4 přeskočeny, TypeScript a build prošly; lint blokuje Windows. Následné úzké nezávislé review: 0 nálezů. 67/67 nasazovacích souborů odpovídá zdrojovému buildu.
- Nasazeno 2026-11-13 z `prvni-verze`, commit `318bd25273627c6b0dedca89c1a78f1bc1e40265` (nasazovací PR č. 5; zdrojové PR č. 4 začleněno jako `dc4fe34`). Coolify deployment `rjecovvywnox9lbsdki6vplk` skončil úspěšně v 17:58:11 UTC. Veřejná stránka, hlavní JavaScript i ZIP vracejí HTTP 200; SHA256 JavaScriptu a ZIPu odpovídá kandidátu.
- Skutečné ověření 0.5.0 A → B → B včetně skladových dokladů a balíčku pro účetní čeká na aktualizaci nainstalovaného doplňku v Chrome z 0.4.0 na 0.5.0. Firefox ani Edge nebyly úspěšně živě ověřeny. Podrobnosti: [dokumentace vydání](docs/nastroje-mujautoservis-podpora-firefox-2026-11-13.md#vydání-050--skladové-doklady).

## Následné opravy importu 0.5.2

- Přejímka 0.5.1 potvrdila nahrazení říjnové dávky listopadovou včetně PDF, ale odhalila odmítnutí neomezeného filtru skladu a chybný převod českých částek CSV. Automatický pokus žádný doklad nevytvořil. Opakování a ZIP dosud nejsou přijaté.
- Zdroj kandidáta 0.5.2 `ic-office-ucetni-sestavy` commit `3b001cb`: opravy filtru a čtení textových CSV. 182 testů prošlo, čtyři přeskočeny, TypeScript a build prošly; review Claude Code vedlo k doplnění ochrany dalších inline skriptů a explicitního měsíce. 67/67 souborů buildu odpovídá podle SHA256. Podrobnosti a hranice ověření: [evidence vydání](docs/nastroje-mujautoservis-podpora-firefox-2026-11-13.md).
