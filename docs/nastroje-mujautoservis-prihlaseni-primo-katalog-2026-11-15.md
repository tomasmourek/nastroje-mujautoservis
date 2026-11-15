# Přihlášení IC Office přímo katalogem

Projekt: nastroje-mujautoservis. Větev: `codex/nastroje-mujautoservis-prihlaseni-primo-katalog`. Datum: 2026-11-15. Účel: nasazení opravy ze zdrojové revize `d6e6845` repozitáře ic-office-ucetni-sestavy.

Přenesen je pouze runtime adaptér `api/katalog-ic-office.mjs`. Po přihlašovacím POST nenásleduje účtově závislou úvodní adresu; ověřuje pevnou stránku katalogu. Cizí původ, neplatná URL a POST 307/308 odmítá. Beze změny formátu katalogu, datového úložiště, účtů a frontendu.

Zdrojové ověření: 257 aplikačních a 86 serverových testů, build a lint s deseti dosavadními varováními; po závěrečné diagnostické úpravě 36 cílených testů adaptéru. Zde navíc kontrola syntaxe, diffu a shody přeneseného souboru. Nezávislé read-only review nalezlo drobnou chybu klasifikace neplatného přesměrování, která je opravená.

Předchozí nasazení `778dc4025ca407eface716703727a004c2f5621a` dokončeno v Coolify. Skutečný přihlašovací e-mail byl doručený a potvrzený; relace přetrvala obnovení stránky. Připojení IC Office skončilo `IC_LOGIN / presmerovani-cesta`. Připojení a splatný plán při zavřeném prohlížeči dosud nebyly potvrzené a musí se ověřit po nasazení této opravy.
