# nastroje-mujautoservis — příprava instalace doplňku

Projekt: `nastroje-mujautoservis`. Větev: `codex/nastroje-mujautoservis-instalace-doplnku`.
Datum: 2026-11-13. Účel: evidence vydání a skutečných hranic ověření.
Zdroj: `ic-office-ucetni-sestavy`, commit `b5b4690`.

## Změna

Panel načítání exportů volí místně podle prohlížeče postup pro Chrome, Edge nebo Firefox. Prohlížeč lze změnit ručně. Platný odkaz na konkrétní stránku doplňku v oficiálním obchodě zpřístupní tlačítko přidání. Dokud odkaz chybí, panel výslovně uvádí nedostupnost instalace z obchodu a nabízí příslušný ruční postup. Mobilní a nerozpoznaný prohlížeč nejdřív žádá volbu cílového počítačového prohlížeče.

Uživatel potvrdil, že vydavatelské účty zatím nemá. Všechny tři odkazy proto zůstávají prázdné. Nevznikl účet, zveřejnění, podepsaný doplněk ani skutečně funkční instalace z obchodu. Instalaci vždy potvrzuje uživatel v prohlížeči.

Zdroj obsahuje generátor tří samostatných nepodepsaných ZIPů pro podání do obchodů, testy variant manifestu a `CHROMEWEBSTORE.md` s podklady a chybějícími náležitostmi. Před podáním zbývají účty, obrázky, kontakty a informace o soukromí včetně přiznání skutečně zpracovávaných dat. Konfigurace odkazů je v `src/lib/instalace-doplnku.json` zdrojového repozitáře; po schválení v obchodech vyžaduje nový build a nasazení.

Rozhraní importu, runtime doplňku, verze 0.5.3 a oprávnění zůstávají zachovány. Ruční ZIP má nadále SHA256 `8F0C894E93D699AB37A208E9E3A8EF91D2E7BD1942DA039580ED5C1190B478B9`.

## Ověření kandidáta

- `npx vitest run`: 193 úspěšných testů, čtyři zákaznické testy bez externích dat přeskočeny. Zahrnuje validaci odkazů, výběr prohlížeče, vykreslení instalačního panelu a varianty balíčků.
- `npm run build`: TypeScript a Vite úspěšné. Zůstává upozornění na velikost hlavního balíčku.
- `npm run doplnek:balicky`: vznikly tři samostatné nepodepsané kandidáty pro Chrome, Edge a Firefox. Nejde o podepsané instalační balíčky.
- Místní náhled v Chrome: přepnutí všech tří návodů, pravdivý stav nedostupného obchodu a skutečné stažení ručního ZIPu. Při šířce 375 px DOM neměl vodorovné přetečení. Mechanická kontrola upraveného rozhraní Impeccable nevrátila nálezy.
- Konzole místního náhledu obsahovala chybu inicializace jiného rozšíření a uzavřeného komunikačního kanálu. Nelze tvrdit, že byla prázdná.
- Všech 67 souborů v `sestavy/` odpovídá zdrojovému `dist/` podle SHA256. API se nemění.

Tato změna nemá nezávislé review. Firefox a Edge nebyly pro tuto přípravu živě ověřeny. Nový skutečný import IC Office ani instalace z obchodu nebyly provedeny. Dřívější produkční ověření importu 0.5.3 popisuje samostatná dokumentace podpory Firefoxu.

## Stav vydání

Claude Code začlenil normálním merge do `prvni-verze` [zdrojové PR #10](https://github.com/tomasmourek/ic-office-ucetni-sestavy/pull/10), merge `445fb5b6103d2526341c7c98a0cb1dcb8b1c223a`, a [nasazovací PR #11](https://github.com/tomasmourek/nastroje-mujautoservis/pull/11), merge `5e3b36ba56294ee443a2f76dafc1b9c0fa271844`. Stav MERGED, cílová větev i oba head SHA byly následně ověřeny přes GitHub CLI.

Coolify úspěšně nasadil commit `5e3b36ba56294ee443a2f76dafc1b9c0fa271844`. Deployment `afzewzgngqhqa0skocd1csae` začal 2026-11-13 ve 20:58:02 UTC a skončil ve 20:58:14 UTC se stavem `finished`. Nasazení spustil Codex tlačítkem Deploy v již přihlášeném Coolify; konektor v Claude Code vracel 401. Nebyla měněna oprávnění, tokeny ani konfigurace serveru.

## Produkční ověření

- Veřejné `sestavy/index.html`, `assets/index-PVxXqcrH.js`, `assets/index-BPLEwdrk.css` a ruční ZIP 0.5.3 vrátily HTTP 200 a přesně odpovídaly lokálním souborům podle SHA256. Nasazení tím odpovídá dříve testovanému kandidátu; testy nebyly bez změny kódu opakovány.
- Na skutečné adrese `https://nastroje.mujautoservis.eu/sestavy/#nacteni` v integrovaném prohlížeči Codexu byla ověřena výchozí volba Google Chrome s `chrome://extensions`, přepnutí na Microsoft Edge s `edge://extensions` a Mozilla Firefox s `about:debugging#/runtime/this-firefox` a `manifest.json`.
- Všechny tři varianty správně hlásily, že instalace z obchodu dosud není dostupná, zobrazily příslušný ruční návod a nabízely ZIP 0.5.3. Firefox zobrazil požadavek 140+ i upozornění, že se dočasný doplněk při ukončení prohlížeče odstraní.
- Kliknutí na odkaz skutečně stáhlo ZIP. SHA256 staženého souboru je `8F0C894E93D699AB37A208E9E3A8EF91D2E7BD1942DA039580ED5C1190B478B9`. Konzole této produkční testovací karty neobsahovala chyby.
- Produkční snímek je uložen lokálně jako `nastroje-mujautoservis-produkcni-instalacni-panel.png` ve vizualizacích chatu ze dne 2026-11-13.

Jde o ověření tří variant panelu na produkci, nikoli o samostatné spuštění všech tří prohlížečových enginů. Instalace z obchodů ani nový import IC Office nebyly součástí této kontroly. Vydavatelské účty, zveřejnění a podpisy stále chybí. Začlenění přes Claude Code není nezávislé review změny.
