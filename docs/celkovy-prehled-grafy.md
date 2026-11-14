# Celkový přehled účetních sestav

Projekt: `ic-office-ucetni-sestavy` · větev: `codex/ic-office-ucetni-sestavy-celkovy-prehled` · datum: 14. 11. 2026.

Účel: vysvětlit tržby, stav úhrady faktur a skladové pohyby uživateli bez účetních znalostí. Nová stránka `#prehled` používá stávající volbu období a nastavení. Nemění účetní sestavy ani exporty a nezavádí další ukládání dat.

## Datový kontrakt

- **Odkud jsou tržby:** základy bez DPH ze stejné funkce `trzby()` jako podrobná sestava, rozdělené na faktury a samostatné pokladní prodeje. Pokladní úhrada navázané faktury se znovu nezapočítá. Respektuje volbu DUZP / vystavení a zahrnutí pokladny v Nastavení. Tržby nejsou přijaté peníze.
- **Faktury podle stavu úhrady:** stejné faktury filtrované DUZP a celé částky s DPH jako v knize faktur. Exportem potvrzený stav rozlišuje zaplacené, částečně zaplacené, nezaplacené a neznámé. Částečná úhrada není použita jako celá zaplacená částka. Nejde o přehled plateb přijatých ve zvoleném období. Datum úhrady může být mimo období faktury.
- **Příjmy podle skladů:** z `inventura()` sloupce příjem + převod na sklad.
- **Výdeje podle skladů:** z `inventura()` sloupce výdej + prodej + převod ze skladu + dobropisy.

Skladové grafy respektují vyloučené sklady. Ukazují obrat ve skladových cenách bez DPH včetně meziskladových převodů, nikoli aktuální stav zásob nebo výsledek hospodaření. Manka, přebytky a storna nejsou součástí těchto podílů a při jejich výskytu je zobrazeno vysvětlení s odkazem na inventuru. Kanonická inventura vykazuje obraty kladně; text tento způsob výpočtu zachovává.

Chybějící export je označen jako chybějící podklad. Načtený prázdný export nebo období bez záznamů se ukáže jako nula, bez koláče. Chybějící část tržeb (faktury / pokladna) je výslovně označena. Po změně období, Nastavení nebo výměně importované dávky se přehled znovu odvodí z aktuálního stavu Reactu.

Záporný základ kterékoliv sazby jednotlivého dokladu, záporná faktura ve stavu úhrad či záporný nevyloučený pohyb ve zvoleném období vypne příslušný koláč a procenta. Zůstane textový přehled částek a odkaz na podrobnou sestavu. Kontrola probíhá před seskupením, aby dobropis nezmizel v kladném součtu. Částky faktur zachovávají znaménka; skladové obraty zachovávají kladnou konvenci inventury.

## Vykreslování a přístupnost

Na stránce jsou současně nejvýše **čtyři instance** grafu. React vlastní DOM, výpočet úhlů i SVG geometrii. Každý graf má nejvýše šest výsečí; u více skladů se pět největších doplní položkou Ostatní sklady. Částky se zachovají na haléře. Výpočty účetních hodnot zůstávají v existujících funkcích, vrstva přehledu pouze seskupuje jejich výstup.

Malý SVG renderer nepotřebuje D3 ani novou závislost, Canvas nebo vlastní interakční životní cyklus. Nejvýše 24 výsečí a textové legendy jsou levné i na mobilu. Pokud by přibyly stovky značek či interaktivní průběhové grafy, je nutné znovu posoudit vykreslování; dnešní renderer se k nim nemá bez rozmyslu rozšiřovat.

Každá hodnota i podíl jsou stále viditelné v textové legendě, bez najetí myši. Barva není jediným nositelem dat. SVG je pro čtečky skryté, protože legenda nese úplné údaje; nadpisy sekcí mají jedinečné vazby. Prvky grafu nemají tooltip, drag, zoom ani animaci. Jedinými interakcemi jsou obvyklé odkazy a stávající filtr období. Navigace zachovává dosavadní URL hash, žádná nová persistence nevzniká.

Na užší obrazovce se grafy řadí pod sebe a legenda pod koláč. Text zůstává skutečným HTML v běžné velikosti; neškáluje se jako součást SVG. Barvy respektují světlý i tmavý motiv. Nula, záporný podklad a chybějící data mají textovou variantu. Při tisku se sekce pokud možno nedělí mezi stránky.

## Ověření

Cílené testy `src/lib/celkovy-prehled.test.ts` pokrývají návaznost na součet knihy faktur, filtr období a datum tržeb, vypnutí pokladny, nezdvojení úhrady faktury, čtyři stavy úhrady, prázdný export proti chybějícímu, dobropis v kladném součtu, zápornou sazbu v kladném dokladu, vyloučení záporného skladového pohybu, převody, haléřové součty skupin a opakované odvození po výměně dávky.

### Provedené místní ověření — 14. 11. 2026

Implementace `1e7b8e0` byla ověřena v Chrome na místním náhledu se syntetickými ukázkovými daty. Deset cílených testů prošlo; TypeScript, aplikační i serverový build prošly. Lint skončil bez chyb, s deseti existujícími upozorněními mimo nové grafy. Mechanický Impeccable detector nad změněným UI vrátil prázdný seznam.

- Před importem všechny čtyři sekce správně vyžadovaly chybějící podklady, bez falešných nul.
- Pro celé načtené období 1.–22. 10. 2026 byly tržby bez DPH **20 070 Kč** (faktury 19 490 Kč, samostatná pokladna 580 Kč), faktury s DPH **23 582,90 Kč** (zaplacené 20 824,10 Kč, nezaplacené 2 758,80 Kč), skladové příjmy **15 790 Kč** a výdeje **6 710 Kč**. Součet tržeb byl přímo porovnán s rozpisem DPH v podrobné sestavě.
- Po přepnutí na 20. 10. 2026 se přehled změnil na tržby **2 280 Kč**, nezaplacenou fakturu **2 758,80 Kč**, příjmy **0 Kč** a výdeje **840 Kč**. Kniha faktur i inventura zobrazily stejné částky. Nulový příjem nezobrazil koláč. Navigace na detaily zachovala období.
- Desktop 1440 px i mobil 390 px zobrazily čtyři sekce bez vodorovného přesahu; ověřeny světlý i tmavý motiv. Částky a podíly byly čitelné v legendách bez najetí myši. [Desktopový snímek](overeni/celkovy-prehled-desktop.jpg) a [mobilní snímek](overeni/celkovy-prehled-mobil.jpg) zachycují výhradně ukázková data. Desktopový snímek je zmenšený náhled celé stránky; na spodním okraji mobilního snímku je drobný artefakt skládání snímku nástrojem při škálování Windows, nikoli další obsah aplikace.

Nezávislý Impeccable finish reviewer nenašel materiální vizuální problém. Původní `fix` požadoval pouze doložení procesní výjimky pro přesně zadané rozšíření zavedeného UI; po doložení označil tento bod `resolved` a vrátil `ship`. Výjimka vychází z `new-work.md`, §3: místní rozšíření ani přesně zadaný úzký požadavek neprocházejí losováním konceptů. Vizuální systém se nemění. Kontrola dokumentace systému je zaznamenána níže.

Nezávislý Impeccable documenter porovnal dokončené komponenty s `PRODUCT.md`, globálními styly, `public/atomys` a existujícími sestavami. Potvrdil zachování tokenů obou motivů, Interu, akcentů `#8a581e / #dfb56b`, mezer `--at-space-2` až `6`, plochých sekcí a úplných HTML legend. Předem chybějící `DESIGN.md` a `.impeccable/design.json` pouze zaznamenal; toto rozšíření jejich vytvoření ani opravu neobjednává. Reviewer ani documenter samostatně nespouštěli testy.

Nejde o nasazení na produkci, skutečný import IC Office ani zákaznickou přejímku. Náhled byl po ověření ukončen.
