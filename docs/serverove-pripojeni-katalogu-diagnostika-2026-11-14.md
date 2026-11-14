# Diagnostika serverového připojení katalogu IC Office

Projekt: ic-office-ucetni-sestavy / nastroje-mujautoservis. Větve: codex/ic-office-ucetni-sestavy-oprava-serveroveho-pripojeni a codex/nastroje-mujautoservis-oprava-serveroveho-pripojeni. Datum: 2026-11-14. Účel: bezpečně určit příčinu produkčního selhání připojení.

Produkční pokusy končily aplikační odpovědí 502. Read-only diagnostika Claude Code potvrdila spuštění workeru, závislosti, DNS/TLS a veřejný přihlašovací formulář IC Office. Formulář a pole odpovídají adaptéru. Diagnostický transport zastavil před prvním POSTem; žádné heslo ani přihlášená relace se nepřebíraly. Skutečná příčina po odeslání přihlášení zatím není potvrzená. SQLite neobsahovala úspěšné připojení ani katalog.

Worker, plánovač a API nově zachovávají jen pevné kódy IC_LOGIN, IC_FORMAT, IC_FILTER, IC_NETWORK, IC_ABORTED, IC_WORKER a povolený krok selhání. API vrací pevný český text; log obsahuje pouze událost, kód a krok. Text IC Office, hesla, cookies, URL, query ani libovolné chybové zprávy nepřecházejí přes tyto hranice. Omezení přesměrování, přihlašování, šifrování, plánů a ochrana před souběhem zůstávají zachovaná.

Po změně prošlo 225 aplikačních a 65 serverových testů; čtyři zákaznické testy bez podkladů přeskočeny. Lint bez chyb (10 dosavadních varování), TypeScript a build prošly. Testy pokrývají přenos bezpečných kódů, spuštění skutečného workeru bez HTTP přihlášení, kroky odmítnutého přesměrování a zachování předchozího katalogu při selhání.

Přejímka pokračuje nasazením a jedním novým pokusem uživatele se zadaným heslem přímo v aplikaci. Tato změna sama nepotvrzuje opravené přihlášení ani skutečný naplánovaný export ze serveru. Tyto části vyžadují nové produkční důkazy.
