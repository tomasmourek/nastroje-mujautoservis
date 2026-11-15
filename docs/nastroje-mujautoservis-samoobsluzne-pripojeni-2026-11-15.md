# Samoobslužné připojení skladového katalogu

Projekt: nastroje-mujautoservis. Větev: `codex/nastroje-mujautoservis-samoobsluzne-pripojeni`. Datum: 2026-11-15. Účel: kandidát nasazení přihlášení e-mailem a evidence místního ověření.

## Změna pro uživatele

V Exportu skladového katalogu nový uživatel zadá e-mail a ve stejném prohlížeči potvrdí jednorázový odkaz. Poté připojí IC Office a zvolí denní, týdenní nebo měsíční serverový běh. Nemusí žádat správce o přístupový kód. Odkaz platí deset minut, relace třicet dní.

Dosavadní kódy fungují dál. Nová relace opravňuje pouze ke katalogu, nikoli k odesílání účetní. Nový účet nepřebírá starší katalog pod kódem a neumožňuje sdílení firmy. Odhlášení plán nezastavuje; odpojení IC Office odstraní připojení, plán a katalog z aktivního úložiště. E-mailový účet zůstává, zálohy mají vlastní dobu uchování.

## Převzetí zdroje a konfigurace

Kandidát přebírá zdroj `ic-office-ucetni-sestavy` `245aa171b8cd2c762374439d16fbdc22f5720b3f`. Všech 67 souborů `sestavy/` a 12 souborů API včetně serverového převodníku odpovídá zdroji podle SHA256. Syntaxe všech modulů API prošla kontrolou `node --check`.

Stávající Dockerfile používá Node.js 24 a kopíruje moduly API včetně nového `katalog-ucty.mjs`. Nemění se nginx ani spouštěcí skripty. Nová databáze `ucty.sqlite` patří do stávajícího soukromého trvalého `KATALOG_DATA_DIR` a musí být zahrnuta do záloh společně s katalogovou databází. Použije se stávající SMTP a šifrovací klíč; žádná nová placená služba ani tajemství v Gitu. Povolený původ je výchozí produkční doména, případně explicitní `KATALOG_ORIGIN` pro jiné prostředí.

Jednorázové odkazy jsou vázané na původní prohlížeč, ukládají se pouze otisky tokenů. Technické cookies mají Secure, HttpOnly, SameSite=Strict a omezenou cestu API. Přepnutí účtu v jiné kartě odmítne staré požadavky včetně stažení a odhlášení. Trvalé limity chrání odesílání odkazů; souběžně mohou pracovat nejvýše dva ruční nebo plánované katalogové běhy nad stejným SQLite svazkem. Rezervace při přerušení požadavku trvá do skutečného ukončení workeru, případně do časového limitu.

## Doložené kontroly

- Zdroj: 257 aplikačních a 86 serverových testů prošlo; čtyři zákaznické testy bez externích podkladů přeskočené. TypeScript a produkční build prošly. Lint nemá chyby, má deset dosavadních varování. Build hlásí dosavadní upozornění na velikost balíčku.
- Místní Chromium se simulovaným API ověřilo žádost o odkaz, výslovné potvrzení bez automatického spotřebování tokenu, připojení, všechny tři četnosti, obnovení stránky, XML/Excel, odhlášení a neplatný odkaz. Šířky 1440 a 375 px bez vodorovného přesahu a chyb stránky; čtyři snímky byly vizuálně zkontrolované. Scénář je ve zdrojovém repozitáři `overeni/ic-office-ucetni-sestavy-samoobsluzne-pripojeni.js`.
- Nezávislé read-only review uzavřelo nálezy k přepnutí identity, globální kapacitě a předčasnému uvolnění rezervace. Závěrečný výsledek: nula nových nálezů. Reviewer testy samostatně nespouštěl.

## Neověřené části a přejímka po nasazení

Tento dokument nepotvrzuje nové produkční nasazení. Skutečné SMTP, přihlášení IC Office a splatný běh při zavřeném prohlížeči nejsou ověřené. Místní simulovaný transport je nenahrazuje. Neověřeny jsou kontejner, obnova nové databáze ze zálohy a samostatné enginy Firefox/Edge.

Po nasazení ověřit doručení odkazu a jeho potvrzení, dvě oddělené identity, skutečné připojení IC Office a plánovaný běh po zavření klienta. Potom stáhnout poslední XML/Excel a porovnat katalog. Pracovní XML stále čeká na údaje e-shopu a není hotovým feedem Google Merchant Center.
