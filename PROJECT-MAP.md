# nastroje-mujautoservis — projektová mapa

Projekt: nastroje-mujautoservis. Větev: `prvni-verze`. Datum: 2026-11-03.
Účel: rozcestník projektu, doložený stav a další ověřitelný výsledek.

## Identita a umístění

- Produkt, publikum, doména: rozcestník nástrojů pro autoservisy; majitelé a účetní autoservisů. Doména `https://nastroje.mujautoservis.eu` (wildcard DNS `*.mujautoservis.eu` → Netcup).
- Remote a checkout: `C:\Projekty\nastroje-mujautoservis`, veřejný GitHub `tomasmourek/nastroje-mujautoservis` (zveřejněn 2026-11-03 na pokyn uživatele, aby jej Coolify stahoval bez klíče; obsahuje jen veřejně servírované soubory).
- Nasazení: Coolify na Netcupu, projekt `nastroje-mujautoservis`, aplikace `nastroje-mujautoservis` (Public Git Repository, větev `prvni-verze`, Dockerfile, port 80). Automatické nasazení po pushi není nastavené; nasazuje se tlačítkem Deploy.
- Vztahy: pod `/sestavy/` se nasazuje build repozitáře `ic-office-ucetni-sestavy`. Odkazuje na archiv.mujautoservis.eu, mujkalendar.eu, mojerezervace.eu a mojefaktura.eu. Vzhled z `atomys-design-system` 2.1.0.

## Produkt

- Rozhodnuto uživatelem: publikum autoservisy; obecné nástroje a atomys.eu jen jako odkaz; samostatný repozitář (původně soukromý, 2026-11-03 zveřejněn); nejdřív náhled, nasazení po schválení (schváleno 2026-11-03).
- Hypotézy: zájem servisů o bezplatné nástroje; formulace přínosů čekají na schválení.

## Aktuální stav

- Etapa: první veřejná verze nasazená na produkci.
- Ověřeno lokálně 2026-11-03: stránka bez chyb v konzoli, na 375 px bez vodorovného přetečení, mobilní nabídka se otevírá, odkaz `sestavy/#nacteni` načte aplikaci a ukázková data; řádek faktury 2026102 v sestavě odpovídá číslům na stránce.
- Otevřené: živé ověření informací o úložišti; automatické nasazení po pushi.

## Důkazy a vydání

- Nezávislé review: neproběhlo.
- Živý smoke test 2026-11-03 (commit 2aa80b8): `/`, `/sestavy/` a assety vrací 200, HTTP přesměruje na HTTPS, certifikát Let's Encrypt platný do 2027-02-01, bezpečnostní hlavičky z `deploy/nginx.conf` přítomné; ukázková data se v živé aplikaci načtou bez chyb v konzoli a řádek faktury 2026102 za říjen 2026 odpovídá stránce. Ostatní domény sdíleného serveru odpovídaly 200.
