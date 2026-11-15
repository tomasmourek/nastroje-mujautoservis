# nastroje-mujautoservis — úplný tiskový podklad

Projekt: nastroje-mujautoservis. Větev: codex/nastroje-mujautoservis-uplny-tiskovy-podklad. Datum: 2026-11-15. Účel: kandidát opravy širokého importu.

Zdroj ic-office-ucetni-sestavy 67b59f3, začleněný PR #21 (93e9059). Doplněk 0.6.2 zachová při HTTP 500 původního PDF úplný ověřený tiskový podklad stejného dokladu. Nevystavuje nový doklad. HTML je výslovně označeno jako náhradní podklad a zůstává v účetním ZIPu v tiskove_podklady/. Původní PDF má přednost.

Všech 67 souborů sestavy/ odpovídá dist/ zdroje podle SHA256; API se nemění. Zdroj: 282 aplikačních testů prošlo, 4 přeskočeny; 86 serverových testů prošlo. Build a lint prošly (10 stávajících varování). Review nálezy byly opraveny a ověřeny regresními testy.

Produkční nasazení, široký import a jeho opakování zatím nebyly ověřeny touto verzí.