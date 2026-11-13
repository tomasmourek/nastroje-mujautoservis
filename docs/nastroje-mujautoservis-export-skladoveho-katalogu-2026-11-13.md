# nastroje-mujautoservis — export skladového katalogu 0.6.0

Projekt: `nastroje-mujautoservis`. Větev: `codex/nastroje-mujautoservis-export-skladoveho-katalogu`.
Datum: 2026-11-13. Účel: evidence buildu a skutečných hranic ověření.
Zdroj: `ic-office-ucetni-sestavy`, commit `c9f59202a2fe52babf858aeb6f1ebae8a0ee0430` (commity `d19553a` a `c9f5920`), začleněno do `prvni-verze` [zdrojovým PR #11](https://github.com/tomasmourek/ic-office-ucetni-sestavy/pull/11) jako merge `6729486`. Strom merge je shodný s `c9f5920`.

## Změna

Sestavy obsahují novou sekci **Export skladového katalogu** (route `#google-sklady`): katalog všech skladů do XML a nastavení denního, týdenního a měsíčního běhu. Doplněk má verzi 0.6.0, ruční ZIP je `sestavy/doplnek/ucetni-sestavy-ic-office-0.6.0.zip`.

Plán běhu se zatím jen ukládá místně v prohlížeči. Automatizace ani serverový plánovač nejsou aktivní; nastavení samo žádný běh nespustí.

## Ověření kandidáta

- Podle předávky zdroje: 225 testů prošlo, 4 přeskočeny, lint 0 chyb a 10 starších varování, build prošel; po posledním commitu (jen přejmenování) byl build znovu spuštěn. Tyto kontroly Claude Code při začlenění neopakoval.
- `sestavy/` nahrazeno obsahem zdrojového `dist/`; zastaralé soubory 0.5.3 odstraněny. Počet souborů zůstává 67.
- SHA256 manifest `dist/` a `sestavy/` v pracovním stromu: 67/67 shodných, hash manifestu `01bf7fdb26e43ce4850dce9dda5affe25bb8dee851df90d61bbe4607dd53f3a5`.
- Klíčové soubory: `assets/index-ZchX91FT.js` `36ae4c9d833e1ff2f046f8853c79eb30e9e4ec2667fed897bb1f502b9354c0fe`, `assets/index-BPLEwdrk.css` `ecc00280ef64b862ee2ec667f6c947c7208d7c9d87d95ef38a0db429aa3868ec`, ZIP 0.6.0 `90b707e7f24604f532806110dc0a78a5952df384ef37bf93d494c250c6e478d3`.
- Git bloby všech 15 změněných souborů (index, assety, ZIP) jsou bajtově shodné s `dist/`. Zbylých 23 nezměněných textových souborů (`atomys/`, `favicon.svg`) má ve zdrojovém `dist/` konce řádků CRLF a Git je ukládá s LF; jde o stejný stav jako v předchozím nasazení.
- API a nginx se nemění. Žádná zákaznická data ani tajemství nejsou součástí změny.

Samotné začlenění a nasazovací diff neměly samostatné nezávislé review. Kontroly kandidáta výše nenahrazují skutečný import doplňkem.

## Nasazení a produkční ověření

Claude Code začlenil zdrojové PR #11 a [nasazovací PR #13](https://github.com/tomasmourek/nastroje-mujautoservis/pull/13) do `prvni-verze`. Produkční commit je `adb131e225b2c6fd45dacdc7f056043e09448f16`. Ručně spuštěný Coolify deployment `eybhrivxdtxdjs8nj8gatpr3` skončil stavem `finished` dne 2026-11-13 v 22:26:48 UTC (23:26:48 Praha).

- Produkční `/sestavy/` vrací HTTP 200 a odkazuje na `assets/index-ZchX91FT.js`. Veřejný ZIP 0.6.0 je dostupný; jeho SHA256 odpovídá kandidátu uvedenému výše.
- V Chrome na produkční stránce `#google-sklady` byl ručně načten čerstvý export Excel ze stránky IC Office „Všechno zboží“, bez hledání a bez omezení skladu. Jde o data přihlášeného uživatele, nikoli o ověření firmy Motoboom. Export ani tento průchod žádné skladové pohyby nebo doklady nevytvářel.
- Aplikace zobrazila **3 103 skladových položek, 18 skladů a 3 053 produktových kódů**. Stažené pracovní XML má 1 867 645 bajtů a SHA256 `d8ed5e17ba8ac40530e6198e4b4ecae0408ea5b488bd6222324143412796127f`.
- Nezávislé porovnání stažených souborů pomocí Python `openpyxl` a `ElementTree` potvrdilo všech 3 103 řádků včetně násobnosti a všech devíti exportovaných polí. Při porovnání byly dekódovány standardní OOXML sekvence (jeden název obsahoval koncové `_x000D_`). Součty množství všech 3 053 jedinečných kódů se shodují. Zachováno je také 23 záporných a 186 nulových zásob i kód s úvodními nulami.
- Opakovaný import stejného Excelu ponechal stejné počty. Druhé skutečně stažené XML je bajtově shodné podle SHA256; položky se nezdvojily. Zákaznické soubory nebyly vloženy do Gitu ani do veřejné dokumentace.

### Nastavení plánu na produkci

Každá z následujících voleb byla uložena v UI a ověřena obnovením stránky. Časová zóna je `Europe/Prague`; test proběhl před půlnocí 13. listopadu 2026.

| Četnost | Uložená volba | Zobrazený příští termín |
| --- | --- | --- |
| Denně | 07:16 | 14.11.2026 07:16 |
| Týdně | středa, 07:16 | 18.11.2026 07:16 |
| Měsíčně | 31. den, 07:16 | 30.11.2026 07:16 |

Volba 31. dne se tedy pro kratší listopad správně omezila na poslední den měsíce. UI při uložení výslovně oznámilo, že automatický běh není aktivní. Zkušební uložený plán byl následně odstraněn přes UI; stránka potvrdila odstranění a vrátila výchozí denní volbu 06:00.

### Neověřené a nedostupné části

- Přímý import přes doplněk 0.6.0 zatím není přijatý. Chrome stále používal starší běžící doplněk; pokus byl správně odmítnut zprávou o požadované verzi alespoň 0.6.0. Soubory v instalované složce jsou aktualizované, uživatel byl požádán o obnovení doplňku. Výše uvedený skutečný import a export proběhl ručně přes Excel.
- Firefox a Edge nebyly v této etapě samostatně živě testovány.
- Ověřeno je ukládání nastavení, nikoli automatické vykonání. Serverový plánovač ani běh při vypnutém prohlížeči nejsou implementované.
- XML je pracovní skladový katalog. Bez napojení e-shopu, produktových odkazů, obrázků a ověřených prodejních cen není přijato jako hotový feed pro Google Merchant Center; příslušné tlačítko je na produkci neaktivní.
