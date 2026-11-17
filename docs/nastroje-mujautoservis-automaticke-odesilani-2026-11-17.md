# nastroje-mujautoservis — nasazení automatického odesílání účetní

Projekt: `nastroje-mujautoservis`. Produkční commit: `499b25ba4bb61911a1765074291dff1489375b6a`. Datum: 2026-11-17. Účel: evidence nasazení a hranice technického a zákaznického ověření.

## Zdroj a chování

Převzat zdroj `ic-office-ucetni-sestavy` `894e19a65eb43b24ccf805997fd195d3a9214bac`, [zdrojové PR #25](https://github.com/tomasmourek/ic-office-ucetni-sestavy/pull/25). Kompletní kontrakt je ve zdrojovém dokumentu `docs/ic-office-ucetni-sestavy-automaticke-odesilani-2026-11-17.md`; runtime se upravuje ve zdrojovém repozitáři.

Nastavení nabízí serverový denní a měsíční plán. Denní zpracuje předchozí pondělí až pátek bez vyhodnocení svátků; měsíční celý předchozí měsíc. Uživatel se přihlásí ověřeným e-mailem, připojí vlastní IC Office a výslovně potvrdí firmu, adresáta, přílohy a kopii nastavení. Server ověřuje vlastní IČO před i po importu. Neúplná dávka se neodešle; automat nevystavuje chybějící skladové doklady.

Plán, rezervace období a otisk odesílání jsou trvalé. Souběh katalogu a účetního importu chrání společný zámek. Nejisté nebo částečné přijetí SMTP zastaví automat bez slepého opakování. Přijetí SMTP serverem neprokazuje doručení do schránky. Provozní vyřešení nejistého výsledku dosud nemá samoobslužné UI.

## Konfigurace a nasazení

Používá se stávající trvalý soukromý adresář `KATALOG_DATA_DIR`, kanonický base64 klíč 32 bajtů `KATALOG_SIFROVACI_KLIC` a `KATALOG_ORIGIN`. Klíč se nesmí nově generovat nad existujícími daty. K dosavadním `ucty.sqlite` a `katalog.sqlite` přibyly `ucetni.sqlite` a `odeslani.sqlite`; svazek i zálohy musí zahrnovat celý adresář. Technický deník se automaticky nepročišťuje, aby stáří nebo restart neobnovily již odeslané období. Retenci a postup reconciliace je potřeba před zákaznickým vydáním provozně určit. Nasazení opravilo spouštěcí skript: soukromé API dostává explicitně `PORT=3000`, protože Coolify nastavuje `PORT=80` pro nginx.

SMTP používá `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`; 587 vyžaduje STARTTLS, 465 přímé TLS. Účetní automat se bez katalogového úložiště, klíče a poštovního transportu nezpřístupní. Tajemství nejsou součástí Gitu ani tohoto dokumentu. Nasazení použilo dosavadní konfiguraci a klíč bez změny; hodnoty tajemství nebyly vypisovány. Start služby potvrdil dostupnou konfiguraci SMTP, nikoliv skutečné doručení zprávy.

## Provedené kontroly

- Zdrojová úplná sada: 303 aplikačních a 182 serverových testů prošlo, čtyři zákaznické testy bez podkladů přeskočeny. Build a lint prošly; zůstává deset dosavadních lint varování a dosavadní upozornění na velikost chunku.
- Nezávislé read-only review životního cyklu a následné úzké review SMTP/deníku/vypínání: po opravě drobné nepřesnosti hlášení 0 zbývajících doložených nálezů. Reviewer nic nespouštěl.
- SHA256: všech 67 souborů `sestavy/`, všech 62 souborů `api/generated/` a všech 17 runtime modulů API se shoduje se zdrojem. Testovací moduly se do obrazu nekopírují. `git diff --check` prošel.
- Skutečný lokální `docker build` prošel s Node.js 24 Alpine. Výsledný obraz má ID `sha256:d774a61d57f6a06dbf3c425e90b885b0cda335330aff2c3c388cfc532b48265e`.
- Obraz byl spuštěn s `--network none`, syntetickým klíčem a syntetickou SMTP konfigurací. Služba ohlásila aktivní katalog i účetní plánovač, vytvořila všechny čtyři SQLite databáze a účetní API bez přihlášení vrátilo HTTP 401. Služba byla řádně ukončena a kontejner odstraněn. Žádná externí pošta nebyla odeslána.

## Produkční nasazení bez Computer Use

- Přes GitHub začleněno zdrojové [PR #25](https://github.com/tomasmourek/ic-office-ucetni-sestavy/pull/25), merge `d976891`, a nasazovací [PR #31](https://github.com/tomasmourek/nastroje-mujautoservis/pull/31), merge `e64a39a`. První deployment skončil, ale API vracelo HTTP 502: zděděné `PORT=80` kolidovalo s nginx (`EADDRINUSE`). Samotný stav Coolify tedy nebyl potvrzením funkčnosti.
- [PR #32](https://github.com/tomasmourek/nastroje-mujautoservis/pull/32), oprava `6a9f330`, nastavuje internímu API port 3000. Lokální Docker build prošel; skutečný kontejner s produkčním `PORT=80`, syntetickou konfigurací a `--network none` vrátil web 200, stav API 200 a účetní API bez přihlášení 401. Testovací kontejner byl ukončen a odstraněn.
- Finální Coolify deployment `45f39008-0146-4cc7-93fe-14a0149b7087` skončil `finished` dne 17. 11. 2026 v **15:58:17 UTC / 16:58:17 Europe/Prague**. Běží obraz `5wvbppnjadlaqcwc07ikri3d:499b25ba4bb61911a1765074291dff1489375b6a` z větve `prvni-verze`.
- Před nasazením vznikly konzistentní online kopie `katalog.sqlite` a `ucty.sqlite` pomocí `node:sqlite.backup`. Obě byly znovu otevřeny a `PRAGMA integrity_check` vrátil `ok`. Leží v soukromém serverovém adresáři `/root/nastroje-mujautoservis-zaloha-pred-automatickym-odesilanim-20261117/` s oprávněními 700/600. Úplná obnova služby ze zálohy nebyla nacvičena.
- Zachován původní Docker svazek `5wvbppnjadlaqcwc07ikri3d-ic-office-katalog`, připojený do `/var/lib/ic-office-katalog`. Po nasazení mají všechny čtyři databáze integritu `ok`; dosavadní účty, relace a katalogové běhy zůstaly přítomné. Nové tabulky mají nula účetních plánů, běhů i pokusů o odeslání.
- Všech **67 veřejných souborů** `sestavy/` a **79 serverových souborů** (17 runtime modulů a 62 generovaných) odpovídá Git objektům nasazeného commitu podle SHA256. Porovnávají se Git objekty, nikoliv Windows checkout s převodem LF/CRLF.
- Veřejné `/sestavy/` odpovídá HTTP 200; `/sestavy/api/stav` vrací HTTP 200 a `pripraveno: true`. `/sestavy/api/ucetni/stav` bez relace vrací očekávané HTTP 401. Start služby potvrzuje `smtp: true`, `katalog: true`, `ucetni: true`, `port: 3000`.
- Nasazení a kontroly proběhly přes SSH, Coolify a HTTP bez Computer Use. Žádný účetní plán nebyl aktivován a nebyla odeslána zkušební zpráva zákazníkovi.

## Co ještě není prokázané

Skutečný vlastní firemní profil IC Office a jeho HTML selektory, účetní import, úplnost zákaznických příloh a doručení účetní zatím nejsou živě ověřeny. Dřívější ovládání prohlížeče ukončila politika Computer Use; zákaz nebyl obcházen. Historické ověření katalogu a ruční Firefox test tyto nové kroky nenahrazují.

Před zákaznickou aktivací ověřit vlastní IČO, úplný balíček a uživatelem potvrzeného příjemce a přílohy. Poté aktivovat blízký termín, zavřít prohlížeč a doložit serverový běh i přijatou zprávu. Opakování stejného období a restart služby musí zachovat jedinou zprávu. Do té doby je doložené technické nasazení a místní testy, nikoliv skutečné automatické odeslání účetní.
