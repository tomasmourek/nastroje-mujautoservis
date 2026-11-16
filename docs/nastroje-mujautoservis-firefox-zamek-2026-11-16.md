# Doplněk 0.6.3 — oprava importu ve Firefoxu

Projekt: `nastroje-mujautoservis`  
Větev: `codex/nastroje-mujautoservis-oprava-firefox-zamku`, základ `1c81a47403e0c273b194b9f74686c21b4ae1b72f`  
Datum: 2026-11-16  
Účel: nasazovací kandidát opravy Firefoxu, oddělení místních testů a produkční přejímky.

## Obsah kandidáta

Zdroj `ic-office-ucetni-sestavy` `d1070d9731856d5869f2d438154dfca5507ead0b`, začleněný PR #23 do `prvni-verze` jako `43d8620a6ddfb4a8b46c922cad82431ac5a6dd75`. Všech 67 souborů `sestavy/` odpovídá zdrojovému `dist/` podle SHA256. API a konfigurace serverového katalogu se nemění.

Firefox dostává exportovaný callback Web Locks s Promise stránky; výsledky zůstávají v prostředí doplňku. Kontrola parametrů PDF používá `URLSearchParams.forEach`, zachovává přesný počet a seznam povolených parametrů. Oprávnění doplňku se nemění.

ZIP `ucetni-sestavy-ic-office-0.6.3.zip`: SHA256 `020206ad26c6451a604f615dac49f630c83ef71ca6a2d30ed82f99e432f256f3`.

## Doložené kontroly zdroje

274 cílených testů prošlo, čtyři testy bez zákaznických vstupů přeskočeny. TypeScript a build prošly, lint má deset dosavadních varování. Úplná serverová sada není zelená kvůli localhost EACCES a chybějící kořenové závislosti nodemailer; server se touto opravou nemění.

Skutečný izolovaný Firefox 160 se syntetickým transportem reprodukoval původní chybu `then` a ověřil opravený katalog, dvě období, opakování, souběh i uvolnění zámku po chybě. Nejde o skutečný zákaznický import ani kontrolu jeho ZIPu. Podrobnosti jsou ve [zdrojové dokumentaci](https://github.com/tomasmourek/ic-office-ucetni-sestavy/blob/43d8620a6ddfb4a8b46c922cad82431ac5a6dd75/docs/ic-office-ucetni-sestavy-firefox-zamek-2026-11-16.md).

## Produkční přejímka

Dosud nedokončena. Nativní ovládání otevřeného Firefoxu odmítá připojení k oknu chybou vlastnictví okna, a to i po obnovení seznamu oken. Nelze proto zatím tvrdit úspěch skutečných importů dvou období, opakování bez duplicit ani úplnost balíčku pro účetní. Nezávislé review druhým agentem neproběhlo.
