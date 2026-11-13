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

Změna nemá nezávislé review. Nasazení a produkční ověření nejsou tímto dokumentem doložena.
