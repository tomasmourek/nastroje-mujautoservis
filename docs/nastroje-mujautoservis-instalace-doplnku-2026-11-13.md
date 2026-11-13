# nastroje-mujautoservis — příprava instalace doplňku

Projekt: `nastroje-mujautoservis`. Větev: `codex/nastroje-mujautoservis-instalace-doplnku`.
Datum: 2026-11-13. Účel: evidence kandidáta a skutečných hranic ověření.
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

Připraveno do pracovní větve k review. Kandidát není začleněn do `prvni-verze` ani nasazen. Produkce tímto ověřením nebyla změněna.
