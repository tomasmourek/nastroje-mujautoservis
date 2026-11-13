# nastroje-mujautoservis — podpora Firefoxu

Projekt: `nastroje-mujautoservis`. Větev: `codex/nastroje-mujautoservis-podpora-firefox`, základ `2eda35c`.
Datum: 2026-11-13. Účel: evidence nasazení doplňků 0.4.0 a 0.5.0 a skutečného rozsahu ověření.

## Změna

Zdroj je v repozitáři `ic-office-ucetni-sestavy`, commit `78c0d60cb8a36508891040ab90c07f852fafba35`, [zdrojové PR č. 3](https://github.com/tomasmourek/ic-office-ucetni-sestavy/pull/3). Manifest obsahuje service worker pro Chrome/Edge a background scripts pro Firefox, Gecko ID a minimum Firefox 140. API používá `browser` ve Firefoxu a `chrome` v Chromiu. Oprávnění zůstávají stejná. Odesílatel musí mít přesný produkční původ, cestu `/sestavy/` a hlavní rámec; volitelný `sender.origin` nesmí být cizí. Automatické odesílání zůstává pozastavené.

Návod popisuje instalaci pro všechny tři prohlížeče. Při aktualizaci je nutné nejprve odebrat starou verzi, aby dvě instalace současně neobsluhovaly jeden import. Nepodepsaný Firefox balíček lze načíst pouze dočasně do ukončení prohlížeče. Podpis Mozilly a trvalá distribuce nejsou součástí doloženého výsledku; před případným podáním na AMO je nutné doplnit deklaraci přenosu dat.

## Provedené kontroly

- 81 testů prošlo, 4 zákaznické testy bez externích dat přeskočeny. Nové testy pokrývají obě rozhraní prohlížečů, asynchronní odpovědi, chyby, souběh, validaci data, původ zpráv a most.
- TypeScript a Vite build prošly. Zůstává dřívější upozornění na velikost některých JavaScript chunků.
- Nasazovací složka `sestavy/` odpovídá zdrojovému `dist/`: 67/67 souborů se shoduje podle SHA256. ZIP 0.4.0 má SHA256 `E7A60DA5F9C94A6A6D9D32CA971DC29ADD8085920CA37ABDAF53A33A4C387675`, hlavní `assets/index-CpL_WVMX.js` má SHA256 `95E60438222490484967304EBEFC076FE45F8BF763B26E0B1CEA0D5CD2B9745F`.
- Osm existujících regresních scénářů prošlo nad místním produkčním buildem v Chromiu bez chyb prohlížeče. Používají simulovaný doplněk a syntetické CSV; nepotvrzují skutečné stažení z IC Office.
- Nezávislé read-only review našlo riziko současné instalace dvou verzí. UI i README byly opraveny na výslovné odebrání staré verze. Další nález nebyl oznámen; reviewer testy samostatně nespouštěl.

## Produkční ověření a zbývající práce

Verze 0.4.0 byla nasazena 2026-11-13. Zdrojové PR č. 3 bylo začleněno jako `c011323ab492c7773d8650aa66f79478f064fc4f`; [nasazovací PR č. 4](https://github.com/tomasmourek/nastroje-mujautoservis/pull/4) jako `ff15b25832bf75f53a23158689e639f73fae7cf5`. Coolify nasadil tento commit z větve `prvni-verze`, deployment `bggb93ernfs2qupw5afccoje`: nový kontejner spuštěn v 16:12:17 UTC, rolling aktualizace dokončena v 16:12:18 UTC, stav Success / Finished.

Veřejná adresa `/sestavy/` vrací HTTP 200. Stažený hlavní JavaScript i veřejný ZIP 0.4.0 mají shodné SHA256 s výše uvedenými soubory kandidáta. Obnovená produkční stránka zobrazuje verzi 0.4.0 a návod pro Firefox. Nastavení prostředí, tajemství ani produkční data nebyly měněny.

### Skutečné importy v Chrome 0.4.0

Uživatel nainstaloval veřejný ZIP 0.4.0 do Chrome; verze byla zkontrolována ve správci rozšíření a produkční stránka rozpoznala doplněk. Předchozí verze 0.3.1 byla odebrána. Dne 2026-11-13 byl na produkci skutečným doplňkem a s přihlášeným IC Office dokončen průchod A `01.–31.10.2026` → B `12.11.2026` → znovu B. Období byla zvolena rychlými tlačítky „Minulý měsíc“ a „Poslední pracovní den (12.11.)“.

| Druh exportu | A: říjen | B: 12. listopadu | Opakování B |
| --- | ---: | ---: | ---: |
| Vystavené faktury | 10 | 1 | 1 |
| Položky vystavených faktur | 56 | 1 | 1 |
| Pokladna | 3 | 0 | 0 |
| Naskladněné zboží | 6 | 0 | 0 |
| Vydané zboží | 23 | 1 | 1 |
| Mechanici a zakázky | 0 | 0 | 0 |

Po volbě B se všech šest říjnových souborů odstranilo ještě před načtením a stránka ukázala „Zatím není načtený žádný export“, 0 ze 6 druhů. Po importu B zůstalo šest souborů pouze se suffixem `_2026-11-12_2026-11-12.xlsx`. Kniha faktur přes celé načtené období obsahovala jednu fakturu za 128,00 Kč; průnik jejích identifikátorů s deseti fakturami A byl prázdný. Říjnové pokladní doklady zmizely; prázdný export B vede na obrazovce pokladny k výzvě k načtení exportu, nikoliv ke staré sestavě. V A byla data podle DUZP i za 30. září, proto kontrola použila celé načtené období, nikoliv jen měsíční filtr.

Opakované načtení B bez změny data ponechalo šest jedinečných názvů a celý seznam souborů včetně počtů a kontrol se přesně shodoval. Import znovu nastavil výchozí filtr „Jeden den“; pro porovnání byl opět zvolen filtr „Celé načtené období“. Poté se celý viditelný obsah všech sedmi obrazovek před opakováním a po něm přesně shodoval, včetně tabulek, částek a souhrnů. Ke zdvojování nedošlo.

| Obrazovka | SHA256 shodného viditelného obsahu před/po |
| --- | --- |
| Tržby a DPH po dnech | `fc919cd16faf95ca8728310bcdcfed1484a5aa842af1758c4793c49798f043c6` |
| Inventura skladů | `5604f3dafa596817e7c98432f43d50cf05271f2043a9a7cae42140890fca57fd` |
| Výkon pracovníků | `5c009ce5d69e7c3af9ad47ce8383507364826d0dc220aeb1c7c0fc7450609c8b` |
| Pokladní kniha | `c8f1a93e796a0ab6ebf0124463fee0b0bef5d423e19d1bbde0454e7fbaf14fb3` |
| Kniha vydaných faktur | `fd416edff51ba650a9e479a641a6993e1a67b396c23af7493b952bbeae510708` |
| DPH a kontrolní hlášení | `798fd656804a4b1d6f7ed1845a8584afb2b95dae7c97db6cd36ae76fbd4faa38` |
| Export pro účetní | `7610c31fb0055e14d0e8dc410d5d948dd514d688e9acca65a4987542276d6674` |

Hash byl vypočten z viditelného textu hlavní oblasti stránky. Zákaznické řádky ani identifikátory nejsou součástí této dokumentace. Generování a odesílání exportů nebylo součástí testu. Dřívější průchody verze 0.3.1 jsou samostatně v [dokumentaci opravy období](nastroje-mujautoservis-nasazeni-opravy-obdobi-2026-11-13.md).

### Zbývající ověření

Ovládání nainstalovaného Firefoxu 147.0.3 zastavil nástroj kvůli nepodporovanému vynucování pravidel URL pro tento Windows prohlížeč. Blokace nebyla obcházena. Uživatel následně provedl ruční test 0.4.0: import selhal chybou `Permission denied to access property "constructor"`. Úspěšný skutečný import ve Firefoxu proto není doložen. Edge nebyl samostatně živě testován; zachování podpory dokládá společná Chromium větev implementace, automatické testy a skutečný průchod v Chrome.

## Vydání 0.5.0 — skladové doklady

Zdroj `ic-office-ucetni-sestavy`, commit `2581e1a`, větev `codex/ic-office-ucetni-sestavy-podpora-firefox`. Opravuje převod binárního exportu ve Firefoxu čtením jednotlivých bajtů bez přístupu k `constructor`. Zahrnuje uživatelem objednané příjemky a výdejky v načtených podkladech a balíčku pro účetní: původní PDF, souhrn po dokladech i celkové částky. Samostatná vypnutá volba dovoluje doplnit chybějící doklady za zvolené období podle výchozích hodnot IC Office.

Každý import doplňku nahradí celou dávku včetně PDF. Deduplikace pokrývá opakování i kombinaci původního ručního XLSX s obohaceným CSV. Nový ruční souhrn zneplatní staré PDF; pro úplný ZIP je nutné znovu přidat originály. Vystavení chrání původový zámek a technické ID nepotvrzeného pohybu v localStorage na ic-office.eu. Marker vzniká před POST a zmizí až po potvrzení správného PDF; nejasný výsledek blokuje další zápisy. Exporty a PDF se do tohoto úložiště nezapisují. Bodová informace je v UI, návodu i na úvodní stránce.

- Finální lokální ověření: 144 testů prošlo, 4 zákaznické testy bez dat přeskočeny; TypeScript a Vite build prošly. Lint zablokoval Windows Application Control u nativního modulu oxlint. Ochrana nebyla obcházena.
- Nezávislé review odhalilo a vedlo k opravě smíšených duplicit, starých PDF a nejistého POST. Následné úzké review těchto tří míst: 0 nálezů; reviewer testy samostatně nespouštěl.
- Složka `sestavy/` odpovídá zdrojovému `dist/`: 67/67 souborů podle SHA256. ZIP 0.5.0: `A3519F7ADEBBB4B1D7C556A843085007775AF2B0188513D176E8D1E8B2901FAE`. Hlavní `assets/index-DpKm4tE8.js`: `0F7BC0BA007937361344CED3C50DD1AFF14F0793B55DB83E32890D596648E1C6`.
- Lokální UI zobrazilo šest ukázkových exportů a novou položku skladového ZIPu, správně vypnutou bez skladových dokladů. Dialog předání syntetických souborů ve dvou pokusech vypršel, takže naplněný nový přehled nebyl vizuálně ověřen. Log obsahoval chyby cizího rozšíření a uzavřeného kanálu zpráv; čistá konzole není doložena.
- V živém IC Office byl při průzkumu jednotlivě vystaven jeden chybějící výdejový doklad k prodeji z 12.11.2026 a po obnovení byl potvrzen jako vystavený. Nejde o přejímku automatické dávky. Ostatní pohyby nebyly hromadně zpracovány; zákaznické exporty a PDF nejsou v repozitáři.

### Nasazení 0.5.0 na produkci

[Zdrojové PR č. 4](https://github.com/tomasmourek/ic-office-ucetni-sestavy/pull/4) bylo začleněno jako `dc4fe34343152c71a3f48ee7a95e77b4247f1f6b`; [nasazovací PR č. 5](https://github.com/tomasmourek/nastroje-mujautoservis/pull/5) jako `318bd25273627c6b0dedca89c1a78f1bc1e40265` do větve `prvni-verze`. Uživatel spustil Deploy v přihlášeném Coolify. Read-only konektor potvrdil deployment `rjecovvywnox9lbsdki6vplk` tohoto commitu ve stavu `finished`: spuštění 2026-11-13 v 17:57:57 UTC, dokončení v 17:58:11 UTC.

Veřejné `/sestavy/`, `assets/index-DpKm4tE8.js` a ZIP 0.5.0 vrátily HTTP 200. SHA256 obou stažených artefaktů se shoduje s výše uvedeným kandidátem. Obnovená produkční stránka zobrazuje nové skladové podklady, sedm druhů exportů a vyžaduje doplněk 0.5.0. Tím je potvrzeno nasazení; skutečný import tato kontrola nenahrazuje.

### Zbývající přejímka 0.5.0

Chrome při zahájení přejímky hlásil instalovaný doplněk 0.4.0 a nepovolil nový import. Veřejný ZIP 0.5.0 byl stažen a rozbalen do Stažených souborů, jeho manifest potvrzuje verzi 0.5.0. Aktualizaci ve správci rozšíření musí dokončit uživatel, protože ovládání správce a výběru složky není nástrojem dostupné. Skutečné A → B → B této verze včetně příjemek/výdejek, originálů, součtů a ZIPu zatím není dokončené; totéž platí pro Firefox a Edge.

Přejímka po vydání: načíst dvě různá období A a B, potom B zopakovat. Po změně musí zmizet všechny podklady A; po opakování B se musejí shodovat počty, jedinečná ID a čísla dokladů, tabulky i částky. V IC Office nesmějí přibýt druhé doklady pro stejné pohyby. ZIP musí obsahovat právě PDF dokladů B a správný souhrn jednotlivých příjemek/výdejek a jejich součtů. Ve Firefoxu musí úspěšně projít skutečný binární přenos bez chyby `constructor`. Odeslání e-mailu účetní není touto kontrolou schváleno ani ověřeno.
