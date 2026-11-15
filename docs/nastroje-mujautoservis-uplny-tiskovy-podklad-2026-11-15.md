# nastroje-mujautoservis — úplný tiskový podklad

Projekt: nastroje-mujautoservis. Nasazený commit: `eac4298dd9f3987805516d7bc4866c2aec648dbf` z větve `prvni-verze`. Datum: 2026-11-15. Účel: nasazení opravy a produkční ověření širokého importu bez duplicit.

Zdroj ic-office-ucetni-sestavy 67b59f3, začleněný PR #21 (93e9059). Doplněk 0.6.2 zachová při HTTP 500 původního PDF úplný ověřený tiskový podklad stejného dokladu. Nevystavuje nový doklad. HTML je výslovně označeno jako náhradní podklad a zůstává v účetním ZIPu v tiskove_podklady/. Původní PDF má přednost.

Všech 67 souborů sestavy/ odpovídá dist/ zdroje podle SHA256; API se nemění. Zdroj: 282 aplikačních testů prošlo, 4 přeskočeny; 86 serverových testů prošlo. Build a lint prošly (10 stávajících varování). Review nálezy byly opraveny a ověřeny regresními testy.

## Nasazení

Zdrojové PR [#21](https://github.com/tomasmourek/ic-office-ucetni-sestavy/pull/21) je začleněné jako `93e9059`; nasazovací PR [#26](https://github.com/tomasmourek/nastroje-mujautoservis/pull/26) jako `eac4298`. Coolify deployment `gpahgr24qv95yzhwj0augnry` začal 15. 11. 2026 v 10:20:01 UTC a skončil v 10:20:15 UTC stavem `finished`. Spuštění proběhlo přes přihlášené UI. Vlastní healthcheck kontejneru je vypnutý; funkčnost dokládají níže uvedené skutečné importy.

Veřejné soubory vrátily HTTP 200 a jejich SHA256 odpovídá nasazeným artefaktům:

| Soubor pod `/sestavy/` | SHA256 |
| --- | --- |
| `index.html` | `DBD2332854032BEDBABA9A5ADE972A61E1661A628A2E537216AE98E8E7692C07` |
| `assets/index-9kQcVN2L.js` | `2F2A4DE478865F73CE6953348A2F0C78C2522D2F376B58B5E564CF9F6A990FD6` |
| `doplnek/ucetni-sestavy-ic-office-0.6.2.zip` | `3AEF032A3A625D6CF99F3C7D90B9E089F77EDBE80BB9ACAF4F5832FA787CFA8D` |

## Dva skutečné široké importy

Produkční Chrome s doplňkem 0.6.2 dvakrát úspěšně načetl **1. 1. 2025 až 31. 10. 2026**. Doplnění chybějících dokladů bylo vypnuté, žádný doklad se nevystavoval ani neupravoval. Dostupná data pokrývají 27. 11. 2025 až 20. 10. 2026. Oba běhy mají stejných sedm exportů:

| Podklad | Počet |
| --- | ---: |
| Vystavené faktury | 97 |
| Položky faktur | 456 |
| Pokladní doklady | 35 |
| Skladové příjmy | 3 082 |
| Skladové výdeje | 212 |
| Zakázky pracovníků | 4 |
| Skladové doklady s PDF | 157 |

Při stejném filtru **Celé načtené období** se přesně shodoval vykreslený obsah všech sedmi sestav: Celkový přehled, Tržby a DPH po dnech, Inventura skladů, Výkon pracovníků, Pokladní kniha, Kniha vydaných faktur a DPH a kontrolní hlášení. Shodoval se seznam načtených souborů i všech 157 názvů PDF. Po novém načtení je nutné pro porovnání nastavit stejný filtr období.

Přehled vydaných dokladů přímo v IC Office za 1. 1. 2025 až 30. 11. 2026 byl po testu znovu načten na obou stránkách (100 + 64 řádků). **164 jedinečných ID pohybů se přesně shoduje s výchozím soupisem**; žádné ID nepřibylo ani nezmizelo.

## Účetní ZIP a Excel

Oba skutečně stažené ZIPy prošly kontrolou CRC. Každý obsahuje 157 platných původních PDF v `originaly/`, CSV souhrn a `informace.txt` (160 záznamů včetně složky). CSV má 157 různých ID, dvě sumarizace a přesné odkazy na všechna PDF. CSV je mezi běhy bajtově shodné; PDF mají stejná jména a shodný extrahovaný text všech 215 stran. Samotné bajty PDF se liší, jejich shoda se proto neposuzovala pouze hashem.

Počty: 110 výdejů, 46 příjmů a 1 vratka zahrnutá mezi příjmy. Příjmy včetně vratky činí 4 318 286,54 Kč bez DPH / 5 225 126,68 Kč s DPH; výdeje 1 002 994,61 Kč bez DPH / 1 213 623,46 Kč s DPH. Stažený Excel je čitelný a obsahuje všech šest nabízených listů.

Doklad **1552053** (příjemka 202660, 23. 7. 2026) již v obou bězích poskytl původní PDF HTTP 200. V balíčku má 44 stran a 2 309 položkových řádků. Extrakce potvrdila první i poslední položku a součty 933 182,60 / 195 968,35 / 1 129 150,94 Kč. První a poslední strana byly také vizuálně zkontrolované, poslední položka i patička jsou úplné. Přítomen je i dříve opravený pohyb 1608728.

Soukromé důkazy zůstaly mimo Git v místním `outputs`: `ic-office-ucetni-sestavy-siroky-import-porovnani-2026-11-15.json`, snímek `ic-office-ucetni-sestavy-siroky-import-balicek-2026-11-15.jpg` a podklady PDF. Oba ZIPy a účetní Excel zůstaly v uživatelských Stažených souborech.

## Hranice důkazu

Balíček obsahuje 157 původních PDF a **0 náhradních HTML**. Nová větev pro PDF HTTP 500 je doložena místními testy, v této produkční přejímce nebyla použita. Příčina původního HTTP 500 uvnitř IC Office zůstává neznámá. Nové vystavování dokladů, Firefox a Edge nebyly součástí tohoto testu.

Zdrojová data vykazují **19 účetních upozornění**, například nesoulad položek a hlaviček, mezery v číselných řadách či chybějící pokladní protějšky. Zůstávají viditelná a vyžadují účetní kontrolu. Úplnost stažených podkladů nedokládá účetní správnost zdrojových dat. Dokumentační doplnění nemění aplikaci a nevyžaduje další nasazení.
