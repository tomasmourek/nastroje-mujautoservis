# nastroje-mujautoservis — podpora Firefoxu

Projekt: `nastroje-mujautoservis`. Větev: `codex/nastroje-mujautoservis-podpora-firefox`, základ `2eda35c`.
Datum: 2026-11-13. Účel: evidence kandidáta doplňku 0.4.0 a skutečného rozsahu ověření.

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

Verze 0.4.0 zatím nebyla nasazena a její skutečný import není doložen. Předchozí úspěšné produkční průchody verze 0.3.1 jsou v [dokumentaci opravy období](nastroje-mujautoservis-nasazeni-opravy-obdobi-2026-11-13.md); nejsou důkazem nového vydání.

Ovládání nainstalovaného Firefoxu 147.0.3 zastavil nástroj kvůli nepodporovanému vynucování pravidel URL pro tento Windows prohlížeč. Blokace nebyla obcházena. Připraveno je opakovat skutečný import A `01.–31.10.2026`, B `01.–12.11.2026` a opět B. Po změně musí A zmizet; po opakování B se musí shodovat šest jedinečných souborů, počty záznamů i tabulky všech sedmi obrazovek přes celé načtené období.

Tunel do Coolify byl otevřen standardním wrapperem. Dashboard nyní požaduje přihlášení uživatele. Nastavení prostředí, tajemství ani produkční data nebyly měněny.
