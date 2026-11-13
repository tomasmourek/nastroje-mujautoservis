# nastroje-mujautoservis — nasazení opravy období IC Office

Projekt: `nastroje-mujautoservis`. Nasazený commit: `0c5b7149dc0956d1593d430adaadb2393fdd855b`.
Datum: 2026-11-13. Účel: doložit začlenění opravy a skutečný rozsah produkčního ověření.

## Začlenění a nasazení

- [Zdrojové PR č. 2](https://github.com/tomasmourek/ic-office-ucetni-sestavy/pull/2): začleněno do `prvni-verze`, merge `864509b881064ea3b436755c70b12b2d28a56f9a`.
- [Nasazovací PR č. 2](https://github.com/tomasmourek/nastroje-mujautoservis/pull/2): začleněno do `prvni-verze`, merge `0c5b7149dc0956d1593d430adaadb2393fdd855b`.
- Produkce: <https://nastroje.mujautoservis.eu/sestavy/>, ověřený server Netcup `159.195.83.205`.
- Coolify aplikace `nastroje-mujautoservis`, UUID `5wvbppnjadlaqcwc07ikri3d`, repozitář `tomasmourek/nastroje-mujautoservis`, větev `prvni-verze`, verzovaný `/Dockerfile`, bez inline přepsání Dockerfile.
- Nasazení přes standardní frontu Coolify, UUID `a46e7794-712d-4434-8574-4cdffb4b173c`, přesný commit `0c5b7149dc0956d1593d430adaadb2393fdd855b`. Stav `finished`, dokončeno `2026-11-13 10:16:16 UTC`; log potvrdil `New container started` a `Rolling update completed`.
- Běží kontejner `5wvbppnjadlaqcwc07ikri3d-20261113T101551`, obraz `5wvbppnjadlaqcwc07ikri3d:0c5b7149dc0956d1593d430adaadb2393fdd855b`.
- Nastavení ani tajné hodnoty prostředí nebyly měněny. Nebyl vytvořen ani použit zapisovací API token Coolify.

## Ověření živého webu

| Kontrola | Výsledek |
| --- | --- |
| HTTPS `/`, `/sestavy/`, `/sestavy/api/stav` | HTTP 200 |
| API stav | `{"pripraveno":true,"kody":true}` |
| HTTP `/sestavy/` | 302 na HTTPS |
| Hlavičky | `nosniff`; HTML `no-cache`, API `no-store` |
| Všech 67 souborů pod `/sestavy/` | Staženy přes veřejné HTTPS; 67/67 odpovídá kanonickým Git objektům commitu `0c5b714` |
| Hlavní JavaScript | `assets/index-C15L4xh2.js`, SHA256 `B70C800F944491A91696B2702F557C632BEF518B7F1E3ECDC662843F665A672D` |
| HTML sestav | SHA256 `D3D2E0D52961F519300477EB8FCC1921A88FCDCA8C48C0C04C8233D136B08157` |

První přímé porovnání s pracovním stromem našlo rozdíly u 23 textových souborů kvůli CRLF na Windows oproti LF v Gitu. Následné porovnání všech stažených souborů přímo s Git objekty prokázalo úplnou shodu; žádná neshoda nasazení nezůstala.

## Ověření v produkčním prohlížeči

Kontrola proběhla v nové kartě Chrome, aby se neměnily původní uživatelovy načtené exporty. Použita byla pouze vestavěná ukázková data; účetní nebyl odeslán žádný e-mail.

- Načteno všech šest ukázkových exportů. Kniha faktur zobrazila čtyři faktury při vlastním rozsahu.
- Návrat ze sestavy zachoval šest exportů i zvolené období importu.
- Rychlá volba `Dnes` změnila období, odstranila všech šest exportů a staré faktury. Kniha faktur následně hlásila chybějící export a období bez dat.
- Ruční změna data klávesnicí z 13. na 14. listopadu rovněž odstranila všech šest exportů. Při neplatném rozsahu bylo tlačítko importu zakázané.
- Opakovaný výběr `Dnes` při již zvoleném stejném období zachoval šest znovu načtených exportů.
- Všechny obrazovky sestav se zobrazily: tržby a DPH, inventura, pracovníci, pokladní kniha, kniha faktur, DPH a kontrolní hlášení, export pro účetní. Jde o kontrolu zobrazení na ukázkových datech, nikoli o nové účetní ověření výpočtů či odeslání.
- Nové spuštění skutečného doplňku při stejném období okamžitě odstranilo starou dávku. Po chybě přihlášení zůstal seznam prázdný a ovládání se znovu zpřístupnilo.

## Omezení a zbývající ověření

Skutečný doplněk reagoval na obě spuštění importu. IC Office však v tomto profilu neměl přihlášenou relaci: aplikace zobrazila nejprve výzvu k přihlášení v otevřené kartě a při opakování `IC Office není přihlášený`. Úspěšné stažení dvou různých období ze skutečného IC Office proto nebylo možné dokončit. Zbývající krok: přihlásit IC Office a zopakovat import období A → návrat → změna na B → import B, s kontrolou, že sestavy obsahují jen B.

Konzole používaného profilu Chrome obsahovala chybu inicializace rozšíření a zprávy `A listener indicated an asynchronous response ... message channel closed`. Produkční konzoli proto nelze označit za čistou; samotné zobrazení a popsané změny stavu proběhly.

Lokální ověření před vydáním: 58 testů prošlo, čtyři zákaznické testy bez externích podkladů byly přeskočeny; TypeScript a Vite build prošly. Osm regresních scénářů s mockem doplňku a syntetickými CSV prošlo, původní build v regresi selhal. Nezávislé review této opravy neproběhlo. Skutečné odesílání e-mailů a zákaznické účetní podklady nebyly testovány.
