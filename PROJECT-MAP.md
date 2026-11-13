# nastroje-mujautoservis — projektová mapa

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
- Firefox má zatím pouze dočasnou nepodepsanou instalaci. Nové produkční nasazení a skutečné importy nejsou zatím doložené; ovládání Firefoxu blokovala politika nástroje a Coolify čeká na přihlášení. Evidence: [podpora Firefoxu](docs/nastroje-mujautoservis-podpora-firefox-2026-11-13.md).
