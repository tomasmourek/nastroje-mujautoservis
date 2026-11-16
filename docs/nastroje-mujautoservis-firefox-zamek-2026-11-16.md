# Doplněk 0.6.3 — oprava importu ve Firefoxu

Projekt: `nastroje-mujautoservis`  
Větev: `codex/nastroje-mujautoservis-oprava-firefox-zamku`, základ `1c81a47403e0c273b194b9f74686c21b4ae1b72f`  
Datum: 2026-11-16  
Účel: evidence nasazení opravy Firefoxu, oddělení místních testů a ruční produkční přejímky uživatelem. Doplněno 2026-11-17.

## Obsah kandidáta

Zdroj `ic-office-ucetni-sestavy` `d1070d9731856d5869f2d438154dfca5507ead0b`, začleněný PR #23 do `prvni-verze` jako `43d8620a6ddfb4a8b46c922cad82431ac5a6dd75`. Všech 67 souborů `sestavy/` odpovídá zdrojovému `dist/` podle SHA256. API a konfigurace serverového katalogu se nemění.

Firefox dostává exportovaný callback Web Locks s Promise stránky; výsledky zůstávají v prostředí doplňku. Kontrola parametrů PDF používá `URLSearchParams.forEach`, zachovává přesný počet a seznam povolených parametrů. Oprávnění doplňku se nemění.

ZIP `ucetni-sestavy-ic-office-0.6.3.zip`: SHA256 `020206ad26c6451a604f615dac49f630c83ef71ca6a2d30ed82f99e432f256f3`.

## Doložené kontroly zdroje

274 cílených testů prošlo, čtyři testy bez zákaznických vstupů přeskočeny. TypeScript a build prošly, lint má deset dosavadních varování. Úplná serverová sada není zelená kvůli localhost EACCES a chybějící kořenové závislosti nodemailer; server se touto opravou nemění.

Skutečný izolovaný Firefox 160 se syntetickým transportem reprodukoval původní chybu `then` a ověřil opravený katalog, dvě období, opakování, souběh i uvolnění zámku po chybě. Nejde o skutečný zákaznický import ani kontrolu jeho ZIPu. Podrobnosti jsou ve [zdrojové dokumentaci](https://github.com/tomasmourek/ic-office-ucetni-sestavy/blob/43d8620a6ddfb4a8b46c922cad82431ac5a6dd75/docs/ic-office-ucetni-sestavy-firefox-zamek-2026-11-16.md).

## Produkční přejímka

Nasazovací [PR #28](https://github.com/tomasmourek/nastroje-mujautoservis/pull/28) byl začleněn do `prvni-verze` jako `eabac29cc4c3b57ce90c36046250870b45b4b2e1`. Coolify spustil deployment `ajyikhvmar2sc36pyo8gyugz` 2026-11-16 ve 13:50:37 UTC a dokončil jej úspěšně ve 13:50:53 UTC. Log potvrzuje sestavení tohoto commitu, spuštění nového kontejneru a dokončení rolling aktualizace. Obraz: `5wvbppnjadlaqcwc07ikri3d:eabac29cc4c3b57ce90c36046250870b45b4b2e1`. Aplikace nemá nakonfigurovaný healthcheck.

Veřejné GET ověření po nasazení:

- `https://nastroje.mujautoservis.eu/sestavy/`: HTTP 200, nový hlavní asset `index-CKOYo725.js`.
- `https://nastroje.mujautoservis.eu/sestavy/doplnek/ucetni-sestavy-ic-office-0.6.3.zip`: HTTP 200, 19 865 bajtů, SHA256 `020206ad26c6451a604f615dac49f630c83ef71ca6a2d30ed82f99e432f256f3`. Stažený produkční ZIP se shoduje s kandidátem.

## Ruční produkční ověření uživatelem 2026-11-17

Po potvrzení připraveného Firefoxu s doplňkem 0.6.3 uživatel k požadovanému průchodu uvedl: „vše jsem ověřil a vypadá to dobře“. Potvrzení se vztahuje na skutečný import dvou různých období, opakované načtení druhého období bez duplicit a balíček pro účetní. Jde o ruční ověření oznámené uživatelem, nikoli o automatický zákaznický test provedený agentem.

| Požadovaný průchod | Oznámený výsledek |
| --- | --- |
| Období A → jiné období B | Uživatel oznámil úspěšné ověření |
| Období B znovu | Uživatel oznámil úspěšné ověření bez duplicit |
| Balíček pro účetní | Uživatel oznámil úspěšné ověření |

Konkrétní rozsahy období, počty a částky záznamů, seznam příjemek/výdejek, hash ani inventář skutečného ZIPu nebyly předány. Úplnost jednotlivých účetních podkladů a stav dokladů přímo v IC Office proto nejsou nezávisle porovnány. Syntetické testy uvedené výše nejsou důkazem těchto zákaznických údajů.

Nativní ovládání uživatelova Firefoxu nejprve selhávalo při připojení k oknu i po resetu relace; následný pokus výslovně zastavila politika nástroje, protože nepodporuje vynucování pravidel URL v tomto prohlížeči Windows. Blokace nebyla obcházena. Tento záznam nepotvrzuje nové živé ověření Chrome/Edge ani serverového plánovače katalogu. Nezávislé review druhým agentem neproběhlo.
