# Přihlášení IC Office přímo katalogem

Projekt: nastroje-mujautoservis. Větev: `codex/nastroje-mujautoservis-prihlaseni-primo-katalog`. Datum: 2026-11-15. Účel: nasazení opravy ze zdrojové revize `d6e6845` repozitáře ic-office-ucetni-sestavy.

Přenesen je pouze runtime adaptér `api/katalog-ic-office.mjs`. Po přihlašovacím POST nenásleduje účtově závislou úvodní adresu; ověřuje pevnou stránku katalogu. Cizí původ, neplatná URL a POST 307/308 odmítá. Beze změny formátu katalogu, datového úložiště, účtů a frontendu.

Zdrojové ověření: 257 aplikačních a 86 serverových testů, build a lint s deseti dosavadními varováními; po závěrečné diagnostické úpravě 36 cílených testů adaptéru. Zde navíc kontrola syntaxe, diffu a shody přeneseného souboru. Nezávislé read-only review nalezlo drobnou chybu klasifikace neplatného přesměrování, která je opravená.

Předchozí nasazení `778dc4025ca407eface716703727a004c2f5621a` dokončeno v Coolify. Skutečný přihlašovací e-mail byl doručený a potvrzený; relace přetrvala obnovení stránky. Připojení IC Office skončilo `IC_LOGIN / presmerovani-cesta`.

## Skutečné produkční ověření serverového plánu

Nasazovací PR #24 a zdrojový PR #19 jsou začleněné. Coolify deployment `w7d9obtorkxmti7wvccirumm` dokončil revizi `39630fb359af947939a91468cb41dcfa33dcb8b4` dne 15. 11. 2026 v 01:52:27 UTC. Uživatel následně připojil IC Office; výchozí úspěšný katalog měl čas 03:01:39 v Praze a obsahoval 3 103 položek z 18 skladů.

Na produkci byl aktivován skutečný denní plán na 03:17 Europe/Prague. Chrome byl úplně zavřený. Read-only kontrola procesů v 03:16:02.195 a 03:17:33.695 potvrdila v obou případech nula procesů Chrome. Po opětovném otevření a novém přihlášení e-mailovým odkazem aplikace bez ručního obnovení katalogu zobrazila poslední úspěch **15. 11. 2026 03:17:15**, opět **3 103 položek / 18 skladů**, a další serverový termín 16. 11. v 03:17. Nešlo o ručně spuštěný import ani simulaci plánovače.

Stažení posledního serverového XML a Excelu prošlo. XML je syntakticky platné, obsahuje 3 053 produktů a 3 103 skladových záznamů v 18 skladech. Excel lze otevřít parserem XLSX a obsahuje 3 103 datových řádků a 18 skladů. SHA256 XML: `254a4f45b847d27dcd7cbda4a8862bf5087d9562797b1aa89db50d9f623162dd`; Excel: `775e2848eb29b1911458cf10571422713a8956214ec53cd37d451cd536ad9984`.

Po testu zůstal automat aktivní **denně v 06:00 Europe/Prague**; obnovení stránky potvrdilo uložený plán, další termín 15. 11. 2026 v 06:00 a nezměněný úspěch 03:17:15. Snímek je uložený mimo Git v `outputs/nastroje-mujautoservis-samoobsluzne-pripojeni/nastroje-mujautoservis-serverovy-katalog-naplanovane-stazeni-2026-11-15.jpg` hlavního checkoutu. Zákaznické exporty ani přihlašovací údaje nejsou součástí commitu.

Hranice důkazu: počítač zůstal zapnutý, Firefox byl otevřený na jiné stránce IC Office a neměl otevřenou katalogovou aplikaci. Živě je doložen serverový běh při úplně zavřeném Chrome, nikoli fyzicky vypnutý počítač. Týdenní a měsíční splatný běh ani restart serveru se v tomto scénáři netestovaly. Pracovní XML nadále vyžaduje napojení e-shopu před použitím v Google Merchant Center.
