# nastroje-mujautoservis — nasazení Celkového přehledu

Projekt: `nastroje-mujautoservis` · větev: `codex/nastroje-mujautoservis-celkovy-prehled` · datum: 14. 11. 2026.

Účel: připravit nasazení nového přehledu a přesně oddělit místní důkazy od produkčního ověření.

## Kandidát

Zdroj: `tomasmourek/ic-office-ucetni-sestavy`, commit `38752fc`, [PR #15](https://github.com/tomasmourek/ic-office-ucetni-sestavy/pull/15). Základ nasazovací větve: `d5b74420c73b5ebb6a57bb351390a38097374dbb`. Novější oprava serverového přihlášení zůstává zachovaná; adresář `api/` nemá změny.

Zdrojový `dist/` byl převzat do `sestavy/`: všech **67 souborů** má shodný SHA256 a počet souborů odpovídá. Produkční HTML kandidáta odkazuje na `index-DxRD-aTd.js` a `index-CuoL3Yr9.css`. Doplněk zůstává 0.6.0.

Deset cílených testů grafů a úplný TypeScript, webový i serverový build prošly po sloučení aktuálního základu. [Datový kontrakt, místní vizuální kontrola a snímky](celkovy-prehled-grafy.md) popisují ukázková data, shodu s podrobnými sestavami i omezení.

## Produkční stav a překážka

Coolify eviduje poslední dokončené nasazení `inzd5s4czt6md1yqvghmys6c`, commit `8f51c39e66d7efd8fc47c7f880f72627c8b55bcf`, dokončení 14. 11. 2026 v 01:57:18 UTC. Otevření produkčního `#prehled` stále zobrazilo načtení exportů a navigaci bez Celkového přehledu.

Požadované začlenění přes Claude Code se nespustilo: CLI skončilo před prvním API krokem s HTTP 429 `usage_limit_reached`, zpráva uvádí obnovu 21. 11. o půlnoci Europe/Prague. Žádný merge ani deployment tímto voláním nevznikl. Nebyly použity placené kredity ani změněna oprávnění.

## Zbývající přejímka

1. Začlenit zdrojové a nasazovací PR do `prvni-verze` přes Claude Code po obnovení limitu, případně ručně vlastníkem.
2. V Coolify nasadit nový merge commit aplikace `nastroje-mujautoservis` a doložit dokončený deployment i shodu veřejných assetů s kandidátem.
3. Na produkčním `#prehled` ověřit prázdný stav, čtyři grafy na ukázkových datech, změnu období a shodu tržeb, faktur a skladových pohybů s podrobnými sestavami. Ověřit desktop/mobil i oba motivy a doplnit skutečné výsledky do této evidence.

Produkční ověření grafů ani zákaznický import dosud nejsou splněné.
