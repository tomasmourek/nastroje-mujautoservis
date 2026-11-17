# nastroje-mujautoservis — kandidát automatického odesílání účetní

Projekt: `nastroje-mujautoservis`. Větev: `codex/nastroje-mujautoservis-automaticke-odesilani`, základ `78ccd94`. Datum: 2026-11-17. Účel: evidence sestaveného kandidáta a hranice jeho ověření.

## Zdroj a chování

Převzat zdroj `ic-office-ucetni-sestavy` `894e19a65eb43b24ccf805997fd195d3a9214bac`, [zdrojové PR #25](https://github.com/tomasmourek/ic-office-ucetni-sestavy/pull/25). Kompletní kontrakt je ve zdrojovém dokumentu `docs/ic-office-ucetni-sestavy-automaticke-odesilani-2026-11-17.md`; runtime se upravuje ve zdrojovém repozitáři.

Nastavení nabízí serverový denní a měsíční plán. Denní zpracuje předchozí pondělí až pátek bez vyhodnocení svátků; měsíční celý předchozí měsíc. Uživatel se přihlásí ověřeným e-mailem, připojí vlastní IC Office a výslovně potvrdí firmu, adresáta, přílohy a kopii nastavení. Server ověřuje vlastní IČO před i po importu. Neúplná dávka se neodešle; automat nevystavuje chybějící skladové doklady.

Plán, rezervace období a otisk odesílání jsou trvalé. Souběh katalogu a účetního importu chrání společný zámek. Nejisté nebo částečné přijetí SMTP zastaví automat bez slepého opakování. Přijetí SMTP serverem neprokazuje doručení do schránky. Provozní vyřešení nejistého výsledku dosud nemá samoobslužné UI.

## Konfigurace a nasazení

Dockerfile, nginx, spouštěcí skripty a produkční konfigurace se tímto kandidátem nemění. Použije se stávající trvalý soukromý adresář `KATALOG_DATA_DIR`, kanonický base64 klíč 32 bajtů `KATALOG_SIFROVACI_KLIC` a `KATALOG_ORIGIN`. Klíč se nesmí nově generovat nad existujícími daty. K dosavadním `ucty.sqlite` a `katalog.sqlite` přibudou `ucetni.sqlite` a `odeslani.sqlite`; svazek i zálohy musí zahrnovat celý adresář. Technický deník se automaticky nepročišťuje, aby stáří nebo restart neobnovily již odeslané období. Retenci a postup reconciliace je potřeba před zákaznickým vydáním provozně určit.

SMTP používá `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`; 587 vyžaduje STARTTLS, 465 přímé TLS. Účetní automat se bez katalogového úložiště, klíče a poštovního transportu nezpřístupní. Tajemství nejsou součástí Gitu ani tohoto dokumentu. Produkční hodnoty a zálohy nebyly touto místní kontrolou měněny ani ověřeny.

## Provedené kontroly

- Zdrojová úplná sada: 303 aplikačních a 182 serverových testů prošlo, čtyři zákaznické testy bez podkladů přeskočeny. Build a lint prošly; zůstává deset dosavadních lint varování a dosavadní upozornění na velikost chunku.
- Nezávislé read-only review životního cyklu a následné úzké review SMTP/deníku/vypínání: po opravě drobné nepřesnosti hlášení 0 zbývajících doložených nálezů. Reviewer nic nespouštěl.
- SHA256: všech 67 souborů `sestavy/`, všech 62 souborů `api/generated/` a všech 17 runtime modulů API se shoduje se zdrojem. Testovací moduly se do obrazu nekopírují. `git diff --check` prošel.
- Skutečný lokální `docker build` prošel s Node.js 24 Alpine. Výsledný obraz má ID `sha256:d774a61d57f6a06dbf3c425e90b885b0cda335330aff2c3c388cfc532b48265e`.
- Obraz byl spuštěn s `--network none`, syntetickým klíčem a syntetickou SMTP konfigurací. Služba ohlásila aktivní katalog i účetní plánovač, vytvořila všechny čtyři SQLite databáze a účetní API bez přihlášení vrátilo HTTP 401. Služba byla řádně ukončena a kontejner odstraněn. Žádná externí pošta nebyla odeslána.

## Co ještě není prokázané

Tento kandidát není produkční nasazení. Skutečný firemní profil IC Office a jeho HTML selektory, účetní import, přílohy a doručení účetní zatím nejsou živě ověřeny. Computer Use ukončila politika pro tento Windows prohlížeč; zákaz nebyl obcházen. Historické ověření katalogu a ruční Firefox test tyto nové kroky nenahrazují.

Produkční přejímka po schváleném nasazení: ověřit obnovitelnou zálohu, vlastní IČO, úplný balíček a uživatelem potvrzeného příjemce. Poté aktivovat blízký termín, zavřít prohlížeč a doložit serverový běh i přijatou zprávu. Opakování stejného období a restart služby musí zachovat jedinou zprávu. Do té doby nelze funkci označit za produkčně ověřenou.
