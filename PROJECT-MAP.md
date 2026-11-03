# nastroje-mujautoservis — projektová mapa

Projekt: nastroje-mujautoservis. Větev: `prvni-verze`. Datum: 2026-11-03.
Účel: rozcestník projektu, doložený stav a další ověřitelný výsledek.

## Identita a umístění

- Produkt, publikum, doména: rozcestník nástrojů pro autoservisy; majitelé a účetní autoservisů. Plánovaná doména `nastroje.mujautoservis.eu` (DNS zatím nenastaveno).
- Remote a checkout: `C:\Projekty\nastroje-mujautoservis`, soukromý GitHub `tomasmourek/nastroje-mujautoservis`.
- Vztahy: pod `/sestavy/` se nasazuje build repozitáře `ic-office-ucetni-sestavy`. Odkazuje na archiv.mujautoservis.eu, mujkalendar.eu, mojerezervace.eu a mojefaktura.eu. Vzhled z `atomys-design-system` 2.1.0.

## Produkt

- Rozhodnuto uživatelem: publikum autoservisy; obecné nástroje a atomys.eu jen jako odkaz; samostatný soukromý repozitář; nejdřív náhled, nasazení a DNS až po schválení textů.
- Hypotézy: zájem servisů o bezplatné nástroje; formulace přínosů čekají na schválení.

## Aktuální stav

- Etapa: prototyp, lokální náhled (`python -m http.server 5180`).
- Ověřeno lokálně 2026-11-03: stránka bez chyb v konzoli, na 375 px bez vodorovného přetečení, mobilní nabídka se otevírá, odkaz `sestavy/#nacteni` načte aplikaci a ukázková data; řádek faktury 2026102 v sestavě odpovídá číslům na stránce.
- Otevřené: schválení textů, nasazení na Netcup, DNS, živé ověření informací o úložišti.

## Důkazy a vydání

- Nezávislé review: neproběhlo.
- Release a živý smoke test: neexistuje.
