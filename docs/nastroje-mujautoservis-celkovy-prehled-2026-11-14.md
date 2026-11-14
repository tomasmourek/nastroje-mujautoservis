# nastroje-mujautoservis — nasazení Celkového přehledu

Projekt: `nastroje-mujautoservis` · větev: `prvni-verze` · nasazený commit: `7e967b1668f2f90fe15e08833342afb008a39276` · datum: 14. 11. 2026.

Účel: doložit začlenění, skutečné nasazení a produkční ověření grafů na syntetických ukázkových datech.

## Začlenění a nasazení

Na výslovný pokyn uživatele byla obě PR začleněna přímo přes GitHub bez Claude Code:

- Zdrojové [PR #15](https://github.com/tomasmourek/ic-office-ucetni-sestavy/pull/15), head `38752fc6243155c63985bef22ef7264c42355abf`, merge `90afcdf62b68ca186feb5276034cf9bcf07314db` v 08:50:55 UTC.
- Nasazovací [PR #19](https://github.com/tomasmourek/nastroje-mujautoservis/pull/19), head `1f8706a0ecfc71dc42a43d7040747add7cdb266a`, merge `7e967b1668f2f90fe15e08833342afb008a39276` v 08:51:10 UTC.

Coolify aplikace `5wvbppnjadlaqcwc07ikri3d` nasadila tento merge commit z `prvni-verze`. Deployment `7y4n6kjnuqoaocm3ivuyrfnm`, spuštěný v přihlášeném rozhraní, skončil `finished` v **08:54:05 UTC (09:54:05 Praha)**. Dokládá jej detail v UI i následné čtení přes Coolify MCP. Přístupový token nebyl vytvořen ani rozšířen.

Předchozí pokus přes Claude Code skončil na HTTP 429 `usage_limit_reached` a nic nezačlenil. Uživatel poté výslovně změnil postup na přímý GitHub.

Převzatých 67 souborů `sestavy/` odpovídalo zdrojovému `dist/`. API se proti základu `d5b7442` nemění; nasazení tak zahrnuje i dřívější opravu přesměrování serverového přihlášení. Doplněk zůstává 0.6.0.

## Veřejné soubory

HTTP 200 vrátily `/`, `/sestavy/`, hlavní JavaScript a CSS. Produkční assety odpovídají Git blobům nasazeného commitu podle SHA256:

| Soubor | SHA256 |
| --- | --- |
| `index-DxRD-aTd.js` | `b0db6290382627e87f6252bfd7aba82f53641ed8c12c2be52abb6931b6cd8c30` |
| `index-CuoL3Yr9.css` | `06223ac4a6beb205c6be2207391b43c38e4564a0fe8bd3fd6c837dfdee6c7dea` |

První porovnání s pracovními soubory Windows se lišilo kvůli CRLF. Normalizace potvrdila shodný text; následné hashování přímo přes `git show HEAD:sestavy/assets/...` potvrdilo bajtovou shodu Git blobů s produkcí.

## Produkční přejímka

Test proběhl v Chrome na [produkčním Celkovém přehledu](https://nastroje.mujautoservis.eu/sestavy/#prehled) v nové kartě. Před importem všechny čtyři sekce správně požadovaly chybějící podklady. Tlačítkem „Vyzkoušet na ukázkových datech“ bylo poté načteno šest syntetických exportů. Stránka zobrazovala označení ukázkových dat; žádná zákaznická karta nebyla přepsána.

| Graf | Celé období 1.–22. 10. 2026 | Jeden den 20. 10. 2026 | Porovnání s detailní sestavou |
| --- | --- | --- | --- |
| Tržby bez DPH | 20 070 Kč: faktury 19 490 Kč, samostatná pokladna 580 Kč | 2 280 Kč | Tržby a DPH: shodný základ 21 % |
| Faktury s DPH | 23 582,90 Kč: zaplaceno 20 824,10 Kč, nezaplaceno 2 758,80 Kč | 2 758,80 Kč, vše nezaplaceno | Kniha faktur: 4 / 1 faktura, shodné součty a stav |
| Příjmy podle skladů bez DPH | 15 790 Kč | 0 Kč | Inventura: shodný celkový příjem |
| Výdeje podle skladů bez DPH | 6 710 Kč | 840 Kč | Inventura: shodný celkový výdej |

Podíly celého období: faktury/pokladna 97,1 / 2,9 %, zaplacené/nezaplacené faktury 88,3 / 11,7 %. Nulový příjem za jediný den nezobrazil koláč ani procenta. Navigace na detaily zachovala období. Návrat na celé období obnovil původní součty.

Desktop 1440 × 1000 a mobilní viewport 390 × 844 byly ověřeny ve světlém i tmavém motivu. Bez vodorovného přesahu: šířka dokumentu 1425 / 375 px včetně prostoru pro svislý posuvník. Čtyři grafové sekce se na mobilu skládají pod sebe v šířce přibližně 343 px. Částky a procenta jsou v HTML legendách čitelné bez najetí myší; ověřeno i posouvání k příjmům a výdejům. Dočasný viewport byl zrušen a původní tmavý motiv obnoven.

- [Produkční desktop — světlý motiv](overeni/celkovy-prehled-produkce-desktop.png)
- [Produkční skladové grafy](overeni/celkovy-prehled-produkce-sklady.png)
- [Produkční mobil — světlý motiv](overeni/celkovy-prehled-produkce-mobil.png)
- [Produkční mobil — tmavý motiv a legenda](overeni/celkovy-prehled-produkce-mobil-legenda.png)

Celostránkový snímek selhal na časovém limitu nástroje; důkazy tvoří snímky viewportu. Konzole obsahovala chyby inicializace cizího rozšíření a uzavřeného kanálu zpráv. Při práci s přehledem nebyla pozorována funkční chyba; tato kontrola se neoznačuje za čistou konzoli.

## Kontroly zdroje a hranice důkazů

Před začleněním prošlo deset cílených testů grafů a úplný TypeScript, webový i serverový build po aktualizaci základu. Lint bez chyb, deset dosavadních upozornění mimo nové grafy. Nezávislý vizuální reviewer uzavřel kontrolu výsledkem `ship`; sám testy nespouštěl. [Datový kontrakt a místní kontrola](celkovy-prehled-grafy.md).

Produkční přejímka grafů na ukázkových datech je splněná. Nejde o nový skutečný import IC Office, samostatný test Firefoxu/Edge, fyzický mobil ani zákaznickou účetní přejímku. Serverové přihlášení a automatické stahování katalogu nejsou tímto ověřením potvrzené.
