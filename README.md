# nastroje.mujautoservis.eu

Rozcestník nástrojů pro autoservisy. Statická stránka (`index.html`) na Atomys design systemu 2.1.0 (kopie v `atomys/`, needituje se). Nabízí nástroje zdarma ke zkoušení v prohlížeči a odkazy na další služby pro autoservisy.

## Struktura

- `index.html`: rozcestník. Obsahuje ukázku vstupu a výstupu, seznam nástrojů a služeb a informace o úložišti v prohlížeči.
- `sestavy/`: sestavená aplikace [ic-office-ucetni-sestavy](https://github.com/tomasmourek/ic-office-ucetni-sestavy) (`npm run build`, obsah `dist/`). Je verzovaná, protože se z ní staví obraz; po změně sestav ji nahraďte novým `dist/` a staré soubory v `sestavy/assets/` smažte.
- `Dockerfile`, `deploy/nginx.conf`: obraz pro Coolify (nginx, port 80; HTTPS a doménu řeší Traefik).

## Nasazení

Coolify na Netcupu stahuje tento veřejný repozitář z větve `prvni-verze` a staví `Dockerfile`. Po pushi se nasazuje ručně tlačítkem Deploy v aplikaci `nastroje-mujautoservis`; pak ověřte `https://nastroje.mujautoservis.eu/` a `/sestavy/`.

## Náhled

```bash
python -m http.server 5180 --bind 127.0.0.1
```

## Pravidla obsahu

- Popisy služeb vycházejí z jejich živých webů; neslibuje se nic, co služba neumí.
- Ukázková čísla odpovídají ukázkovým datům aplikace sestav (faktura 2026102, říjen 2026).
- Stránka nepoužívá cookies ani analytiku; `localStorage` jen pro zvolený motiv.
