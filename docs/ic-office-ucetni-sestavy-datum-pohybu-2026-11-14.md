# Produkční ověření data pohybu a skladových vratek

Projekt: nastroje-mujautoservis. Větev: `codex/nastroje-mujautoservis-overeni-importu-dokladu`. Datum: 2026-11-14.
Účel: doložit opravu importu, opakování bez nových dokladů a přesné hranice přejímky.
Zdroj: `ic-office-ucetni-sestavy` `f962c8422329a80eab6afb6951079500b112faed`.
Produkční revize: `nastroje-mujautoservis` `6f81a9adb9277539c2f6499a79edf9f29d47af9d`.

## Oprava a nasazení

- Doplněk 0.6.1 uvádí ID pohybu při neplatném datu ve formuláři, seznamu pohybů i přehledu vystavených dokladů. ID přidává také k chybě chybějícího čísla nebo neznámého typu. Neplatný kalendářní den odmítá před vystavením dokladu.
- Typ `Vratka ze zakázky / prodeje` zpracuje jako příjem do skladu. V souhrnném CSV zachová původní označení, kladné částky a jediný záznam pro stejné ID. Ostatní neznámé typy odmítá.
- Pohyb 1608728 měl datum pohybu 24. 8. 2026 a předvyplněné datum dokladu `30.11.-0001`. Datum bylo změněno na 24. 8. 2026 a výdejka 202644 vytvořena jediným potvrzením. Opětovné otevření úpravy potvrdilo uložené datum.
- Zdrojové PR #16 a nasazovací PR #21 byly začleněny. Coolify dokončil deployment `zf4dfwrc32izhjs7mqdp05ll` dne 14. 11. 2026 v 12:52:51 UTC z revize `6f81a9a`. Všech 67 souborů sestav odpovídalo zdrojovému dist podle SHA256; veřejný JavaScript a ZIP 0.6.1 byly také porovnány s kandidátem. API se touto změnou nemění.
- Uživatel potvrdil obnovení již nainstalovaného doplňku na 0.6.1. Následující přejímka proběhla v připojeném Chrome na produkci se skutečnými exporty IC Office.

## Změna období a opakované importy

1. **24. 8. 2026:** sedm načtených exportů, dva skladové záznamy a dvě PDF (1608727, 1608728). Příjemka i výdejka mají jednotlivě 213,11 Kč bez DPH / 257,86 Kč s DPH.
2. Opakování stejného období zachovalo přesně text seznamu načtených souborů a všech sedmi sestav: Celkový přehled, Tržby, Inventura, Pracovníci, Pokladna, Faktury, DPH. Toto porovnání proběhlo bez doplňování dokladů; další opakování s výslovně zapnutým doplňováním zachovalo shodný seznam sedmi souborů a dvě PDF.
3. Změna na **24. 9. 2026** okamžitě vyprázdnila předchozí exporty ještě před novým načtením. Nový import se zapnutým doplňováním obsahoval sedm exportů, pět skladových záznamů a pět PDF pro ID 1665047, 1665414, 1665440, 1665441 a 1665450. Srpnová ID v nové sadě nebyla.
4. Opakování zářijového období se zapnutým doplňováním zachovalo přesně seznam souborů i všech sedm uvedených sestav při stejném filtru. Návratka 1665450 již import neblokuje.
5. Před opakováními i po nich měl obnovený přehled IC Office 157 řádků a 157 různých ID pohybů. Po testech byla načtena obě stránkovaná data (100 + 57); všech sedm ID ze dvou testovaných dnů se objevilo právě jednou. Nebyl proveden úplný rozdíl všech historických ID před/po, protože se původní sada nezachovala přes obnovení nástroje. Kontrola prokazuje nezměněný počet, jedinečnost aktuální sady a jednotlivý výskyt testovaných ID.

## Balíčky pro účetní

Oba ZIPy byly skutečně staženy z produkčního tlačítka „Příjemky a výdejky (ZIP s PDF a souhrnem)“ a místně otevřeny. Soukromé exporty ani údaje partnerů nejsou v Gitu.

- Srpnový ZIP obsahuje dva rozdílné originály PDF se správným datem 24. 8. 2026, čísly 202643/202644 a částkami 213,11 / 257,86 Kč. Souhrn obsahuje dva záznamy, odkazy na existující PDF a správné součty příjmu/výdeje. Opakovaný import nepřidal další soubory.
- Zářijový ZIP obsahuje pět PDF podle ID a pět záznamů v CSV, každý ID právě jednou. Příjmy včetně vratky: 930 454,00 Kč bez DPH / 1 125 849,34 Kč s DPH. Výdeje: 929 141,66 Kč bez DPH / 1 124 261,41 Kč s DPH. Vratka zachovává původní typ a originál příjemky 20266.
- **Zjištěné omezení:** tři různé historické pohyby 1665047, 1665414 a 1665441 mají číslo 20268 a jejich PDF z IC Office zobrazují stejnou souhrnnou výdejku se součtem všech tří pohybů. První dvě PDF jsou bajtově shodná; třetí má shodný extrahovaný obsah, ale jiný hash. ZIP je ukládá pod třemi ID. Jde o již existující vazbu více pohybů na jeden doklad, nikoli o nové doklady při opakování importu. Souhrn CSV sčítá dílčí hodnoty pohybů správně, ale ZIP nelze označit za zcela bez duplicitních originálů. Samostatná deduplikace skutečných sdílených dokladů nebyla touto opravou provedena; samotné shodné číslo není bezpečným identifikátorem dokladu.
- Hodnoty položkové inventury respektují stávající nastavení skladů, včetně vyloučeného skladu; nemusejí se rovnat souhrnu všech dokladů. Nastavení zákazníka nebylo měněno.

## Další překážky přejímky

- Široký import 1. 1. 2025–31. 10. 2026 s doplňkem 0.6.1 již nehlásí původní neplatné datum ani nepodporovanou vratku. Skončil chybou „Nelze stáhnout PDF skladového dokladu 1552053.“ Přímé otevření jeho PDF v IC Office zobrazilo ERROR 500. Aplikace správně odmítla neúplný import. Celé široké období není úspěšně ověřeno.
- Serverový katalog je samostatný tok. Nasazení opravy přesměrování ani úspěšný import doplňkem neprokazují serverové přihlášení či splatný běh při zavřeném prohlížeči. V otevřeném Nastavení není vyplněný přístupový kód firmy a přihlašovací heslo IC Office není k dispozici. Skutečné serverové připojení a plánovaný běh zůstávají **NEOVĚŘENÉ**. Je nutné zabezpečené zadání připojení uživatelem; tajemství nepatří do chatu ani Gitu.

## Místní kontroly

Cílené testy doplňku a skladových podkladů: 163/163. Serverový katalog: 69/69. TypeScript, lint a build 0.6.1 prošly. Úplný npm test má čtyři nesouvisející chyby SMTP mocků v `server/transport.test.mjs` (`createTransport.mock.calls[0]` je undefined); 248 testů prošlo a čtyři byly přeskočeny. Tyto kontroly proběhly nad implementací před nasazením; dokumentační doplnění bylo ověřeno `git diff --check`. Nezávislé review této opravy neproběhlo; Claude Code neměl dostupnou kapacitu.
