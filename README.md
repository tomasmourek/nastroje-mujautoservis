# nastroje.mujautoservis.eu

Rozcestník nástrojů pro autoservisy. Statická stránka (`index.html`) ve stylu a paletě úvodní stránky archiv.mujautoservis.eu (`web.css`, `web-motion.js`, písmo Inter v `fonts/`, náhledy aplikace v `nahledy/`). Z Atomys 2.1.0 (kopie v `atomys/`, needituje se) používá jen `vzhled.js` pro přepínání motivu. Nabízí nástroje zdarma ke zkoušení v prohlížeči a odkazy na další služby pro autoservisy.

## Struktura

- `index.html`: rozcestník. Obsahuje animovanou ukázku vstupu a výstupu, snímky aplikace s ukázkovými daty, seznam nástrojů a služeb a informace o úložišti v prohlížeči.
- `sestavy/`: sestavená aplikace [ic-office-ucetni-sestavy](https://github.com/tomasmourek/ic-office-ucetni-sestavy) (`npm run build`, obsah `dist/`). Je verzovaná, protože se z ní staví obraz; po změně sestav ji nahraďte novým `dist/` a staré soubory v `sestavy/assets/` smažte.
- `Dockerfile`, `deploy/nginx.conf`: obraz pro Coolify (nginx, port 80; HTTPS a doménu řeší Traefik).

## IC Office Tutoriál

Na [stránce tutoriálu](tutorial/) je verze 2.59.0 pro Chrome, Edge, Brave, Operu, Firefox a Safari. Stránka nabízí návody podle prohlížeče a stahuje šest vydaných ZIPů přímo z `tutorial/ke-stazeni/`. Při aktualizaci převezměte nové balíčky z vydání Tutoriálu a upravte verzi i odkazy v `tutorial/index.html`. Na stejné stránce jsou pokyny k první cvičné zakázce. Soubor `tutorial/soukromi.html` vychází z `PRIVACY.md` příslušného vydání.

## Instalace doplňku pro účetní sestavy

Panel načítání exportů nabízí postup pro Chrome, Edge a Firefox. Instalace z obchodu zatím není dostupná; vydavatelské účty a zveřejněné stránky doplňku dosud nejsou připravené. Skutečné odkazy se nastavují ve zdrojovém repozitáři v `src/lib/instalace-doplnku.json`, pak se znovu sestaví aplikace. Podklady k vydání a odděleným balíčkům jsou ve zdrojovém `CHROMEWEBSTORE.md`. [Ověření tohoto kandidáta](docs/nastroje-mujautoservis-instalace-doplnku-2026-11-13.md).

## Nasazení

Připravený kandidát přidává serverové denní nebo měsíční odesílání účetní s ověřeným přihlášením e-mailem, kontrolou vlastní firmy a trvalým deníkem proti opakování. Vyžaduje stávající trvalý katalogový svazek, šifrovací klíč a SMTP. Lokální testy i Docker prošly; produkční import a doručení zatím nejsou ověřené. [Konfigurace a přejímka kandidáta](docs/nastroje-mujautoservis-automaticke-odesilani-2026-11-17.md).

Coolify na Netcupu stahuje tento veřejný repozitář z větve `prvni-verze` a staví `Dockerfile`. Po pushi se nasazuje ručně tlačítkem Deploy v aplikaci `nastroje-mujautoservis`; pak ověřte `https://nastroje.mujautoservis.eu/` a `/sestavy/`.

Kandidát serverového stahování skladového katalogu používá Node.js 24 s vestavěnou SQLite a nginx. Automat se zpřístupní až po nastavení trvalého svazku a šifrovacího klíče. Uživatel s přístupovým kódem firmy jej poté sám připojí ke svému účtu IC Office a aktivuje plán; bez konfigurace zůstává neaktivní. [Příprava a ověření nasazení](docs/nastroje-mujautoservis-serverovy-katalog-2026-11-14.md).

## Náhled

```bash
python -m http.server 5180 --bind 127.0.0.1
```

## Pravidla obsahu

- Popisy služeb vycházejí z jejich živých webů; neslibuje se nic, co služba neumí.
- Ukázková čísla odpovídají ukázkovým datům aplikace sestav (faktura 2026102, říjen 2026).
- Stránka nepoužívá cookies ani analytiku; `localStorage` jen pro zvolený motiv.
