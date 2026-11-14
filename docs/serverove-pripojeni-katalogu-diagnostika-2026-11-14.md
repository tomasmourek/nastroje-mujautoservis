# Diagnostika serverového připojení katalogu IC Office

Projekt: ic-office-ucetni-sestavy / nastroje-mujautoservis. Větve: codex/ic-office-ucetni-sestavy-oprava-serveroveho-pripojeni a codex/nastroje-mujautoservis-oprava-serveroveho-pripojeni. Datum: 2026-11-14. Účel: bezpečně určit příčinu produkčního selhání připojení.

Produkční pokusy končily aplikační odpovědí 502. Read-only diagnostika Claude Code potvrdila spuštění workeru, závislosti, DNS/TLS a veřejný přihlašovací formulář IC Office. Formulář a pole odpovídají adaptéru. Diagnostický transport zastavil před prvním POSTem; žádné heslo ani přihlášená relace se nepřebíraly. Skutečná příčina po odeslání přihlášení zatím není potvrzená. SQLite neobsahovala úspěšné připojení ani katalog.

Worker, plánovač a API nově zachovávají jen pevné kódy IC_LOGIN, IC_FORMAT, IC_FILTER, IC_NETWORK, IC_ABORTED, IC_WORKER a povolený krok selhání. API vrací pevný český text; log obsahuje pouze událost, kód a krok. Text IC Office, hesla, cookies, URL, query ani libovolné chybové zprávy nepřecházejí přes tyto hranice. Omezení přesměrování, přihlašování, šifrování, plánů a ochrana před souběhem zůstávají zachovaná.

Po změně prošlo 225 aplikačních a 65 serverových testů; čtyři zákaznické testy bez podkladů přeskočeny. Lint bez chyb (10 dosavadních varování), TypeScript a build prošly. Testy pokrývají přenos bezpečných kódů, spuštění skutečného workeru bez HTTP přihlášení, kroky odmítnutého přesměrování a zachování předchozího katalogu při selhání.

Přejímka pokračuje nasazením a jedním novým pokusem uživatele se zadaným heslem přímo v aplikaci. Tato změna sama nepotvrzuje opravené přihlášení ani skutečný naplánovaný export ze serveru. Tyto části vyžadují nové produkční důkazy.

## Zjištěný krok a kandidát opravy přesměrování

Větve: `codex/ic-office-ucetni-sestavy-prihlaseni-presmerovani` a `codex/nastroje-mujautoservis-prihlaseni-presmerovani`. Datum: 2026-11-14.

Read-only diagnostika Claude Code ověřila běžící produkční obraz `8f51c39e66d7efd8fc47c7f880f72627c8b55bcf`. Čtyři pokusy mezi 02:03 a 02:05 UTC skončily `IC_LOGIN` v kroku `presmerovani-parametry`. Původ cíle přesměrování prošel kontrolou. Hodnoty URL a parametrů se nelogují, takže konkrétní parametr není doložený a přijetí hesla IC Office není potvrzené.

Adaptér nově přijme jediný parametr `_fid` s 1–64 znaky `A–Z`, `a–z`, číslicemi, podtržítkem nebo pomlčkou, pouze v přihlašovacím přesměrování na povolenou cestu stejného původu. Před následným GET parametr odstraní. Akce formuláře s parametry, jiné query včetně `do` a `backlink`, vícenásobné parametry, fragmenty, cizí původ a neznámé cesty se stále odmítají. POST s heslem se neopakuje ani při 307/308. Návrat přihlašovacího formuláře dál znamená `IC_LOGIN`; úspěch vyžaduje ověřený nefiltrovaný katalog a platný export.

Po opravě prošlo 69 serverových testů, sestavení serverového převodníku a lint (bez chyb, 10 dosavadních varování). První spuštění API testů omezil sandbox chybou EACCES na localhost; opakování mimo sandbox prošlo celé. Nové regresní testy ověřují přesměrování na `/` i `/overview/`, odstranění parametru a těla, odmítnuté přihlášení i nepovolené cíle. Jde o simulovaný transport, nikoli produkční přihlášení. Skutečný serverový katalog a naplánovaný běh při zavřeném prohlížeči zůstávají neověřené.
