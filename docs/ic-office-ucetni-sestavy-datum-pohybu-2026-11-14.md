# Oprava data pohybu a zpracování skladových vratek

Projekt: ic-office-ucetni-sestavy. Větev: `codex/ic-office-ucetni-sestavy-datum-skladoveho-pohybu`. Datum: 2026-11-14.
Účel: opravit blokující import bez opakovaného vystavování dokladů a doložit hranice ověření.

## Opravené chování

- Doplněk 0.6.1 uvádí ID pohybu při neplatném datu ve formuláři, seznamu pohybů i přehledu vystavených dokladů. ID přidává také k chybě chybějícího čísla nebo neznámého typu. Neplatný kalendářní den zůstává odmítnutý před vystavením dokladu.
- Přesný typ `Vratka ze zakázky / prodeje` je příjem do skladu. Import zachová původní označení v souhrnném CSV, kladné částky a jediné PDF pro stejné ID. Ostatní neznámé typy zůstávají odmítnuté.

## Skutečný IC Office

- Pohyb 1608728 měl datum pohybu 24. 8. 2026 a v předvyplněném formuláři nevystaveného dokladu neplatné datum `30.11.-0001`. Ve formuláři bylo datum změněno na 24. 8. 2026 a doklad vytvořen jediným potvrzením. IC Office potvrdil vygenerování výdejky 202644; opětovné otevření úpravy potvrdilo uložené datum.
- Následující skutečný import období 1. 1. 2025–31. 10. 2026 již nehlásil neplatné datum. Zastavil se na dosud nepodporované vratce. Přehled a tiskový náhled pohybu 1665450 potvrdily platnou skladovou příjemku a kladné částky; nejde o důvod mazat nebo upravovat zákaznický doklad.
- Před dalším testem byl zaznamenán přehled 157 vystavených dokladů se 157 různými URL pohybů. Některá čísla dokladů jsou již před testem sdílená různými pohyby; tato historická skutečnost sama nedokládá duplicitu způsobenou opakováním importu.

## Zbývající přejímka

Nový doplněk a parser ještě vyžadují nasazení a skutečný opakovaný import se srovnáním ID dokladů, sestav a balíčku. Serverové automatické stahování je samostatný tok: dokončené nasazení opravy přesměrování neprokazuje úspěšné přihlášení ani splatný běh bez prohlížeče. Nově otevřený panel nemá vyplněný přístupový kód firmy; bezpečné připojení čeká na uživatele. Tajemství a zákaznické exporty nejsou součástí tohoto dokumentu ani Gitu.

## Místní kontroly

Cílené testy doplňku a skladových podkladů: 163/163. Serverový katalog: 69/69. TypeScript, lint a build 0.6.1 prošly. Úplný npm test má čtyři nesouvisející chyby SMTP mocků v server/transport.test.mjs (createTransport.mock.calls[0] je undefined); 248 testů prošlo a čtyři byly přeskočeny. Tato omezení nenahrazují živou přejímku.

