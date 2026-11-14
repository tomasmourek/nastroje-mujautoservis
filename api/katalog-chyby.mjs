// Přes hranici workeru/API smějí projít pouze tyto pevné kódy a zprávy.
const ZPRAVY = {
  IC_LOGIN: "IC Office nepotvrdil přihlášení. Přihlašovací údaje nebo odpověď přihlašovací stránky nebyly přijaty.",
  IC_FORMAT: "IC Office nevrátil rozpoznaný úplný katalog nebo platný export XLSX.",
  IC_FILTER: "Katalog IC Office je filtrovaný. Vymažte hledání ve Sklady → Všechno zboží a opakujte načtení.",
  IC_NETWORK: "Server se nedokázal spojit s IC Office. Opakujte načtení později.",
  IC_ABORTED: "Načtení katalogu IC Office bylo zrušeno nebo překročilo časový limit.",
  IC_WORKER: "Server nedokázal zpracovat katalog. Obraťte se na správce aplikace.",
};

export function zpravaChybyKatalogu(kod) {
  return typeof kod === "string" && Object.hasOwn(ZPRAVY, kod) ? ZPRAVY[kod] : null;
}

export function krokChybyKatalogu(krok) {
  return ["formular", "prihlaseni", "presmerovani", "presmerovani-parametry", "presmerovani-cesta", "presmerovani-puvod", "katalog", "export", "kontrola", "prevod"].includes(krok) ? krok : null;
}

export class ChybaKatalogu extends Error {
  constructor(kod, krok) {
    const code = zpravaChybyKatalogu(kod) ? kod : "IC_WORKER";
    super(ZPRAVY[code]);
    this.code = code;
    this.krok = krokChybyKatalogu(krok);
  }
}
