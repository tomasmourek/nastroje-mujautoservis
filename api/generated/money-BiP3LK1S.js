import { t as e } from "./vypocty-DWCkItoB.js";
import { m as t, p as n } from "./zaklad-BALOwaPP.js";
import { a as r, d as i, f as a, i as o, l as s, n as c, o as l, p as u, r as d, s as f, t as p, u as m } from "./xml-Br9103J-.js";
// src/lib/export/money.ts
var h = {
	hotove: "hotově",
	karta: "kartou",
	prevod: "převodem",
	dobirka: "dobírkou",
	jine: "převodem"
};
function g(e) {
	return r("SouhrnDPH", d("Zaklad0", c(e[0].zaklad)), d("Zaklad5", c(e[12].zaklad)), d("Zaklad22", c(e[21].zaklad)), d("DPH5", c(e[12].dph)), d("DPH22", c(e[21].dph)));
}
function _({ f: i, polozky: p, rozpis: m }, _) {
	let v = a(i.adresa), y = p.map((e, t) => {
		let n = f(i, e);
		return r("Polozka", d("Popis", e.nazev.slice(0, 50)), d("PocetMJ", l(n.mnozstvi)), d("SazbaDPH", u(e)), d("Cena", l(n.cenaMj)), r("SouhrnDPH", d("Zaklad_MJ", l(n.cenaMj)), d("DPH_MJ", l(n.dph / n.mnozstvi)), d("Zaklad", c(n.bez)), d("DPH", c(n.dph))), d("CenaTyp", "0"), d("Poradi", t + 1));
	});
	if (!p.length) {
		let t = 0;
		for (let n of e) m[n].zaklad && y.push(r("Polozka", d("Popis", i.popis || `Faktura ${i.cislo}`), d("PocetMJ", "1"), d("SazbaDPH", n), d("Cena", c(m[n].zaklad)), d("CenaTyp", "0"), d("Poradi", ++t)));
	}
	let b = n(t(e, (e) => m[e].zaklad + m[e].dph) + i.zaokrouhleni);
	return r("FaktVyd", d("Doklad", i.cislo), d("Popis", (i.popis || (i.zakazka ? `Zakázka ${i.zakazka}` : `Faktura ${i.cislo}`)).slice(0, 50)), d("Vystaveno", i.vystaveni), d("DatUcPr", i.duzp), d("PlnenoDPH", i.duzp), o("Splatno", i.splatnost), o("Uhrazeno", i.zaplaceno), o("KodDPH", _.cleniDph), d("ZjednD", "0"), d("VarSymbol", i.vs || i.cislo), d("Druh", "N"), d("Dobropis", i.dobropis ? "1" : "0"), d("Uhrada", h[s(i.forma)]), o("PredKontac", _.predkontaceFaktur), d("ZpVypDPH", "1"), d("SazbaDPH1", "12"), d("SazbaDPH2", "21"), g(m), d("Celkem", c(b)), o("Poznamka", i.zakazka ? `Zakázka ${i.zakazka}, import z IC Office` : "Import z IC Office"), r("DodOdb", d("ObchNazev", i.zakaznik), r("ObchAdresa", d("Ulice", v.ulice), d("Misto", v.obec), d("PSC", v.psc), d("KodStatu", "CZ")), d("FaktNazev", i.zakaznik), o("ICO", i.ico), o("DIC", i.dic), r("FaktAdresa", d("Ulice", v.ulice), d("Misto", v.obec), d("PSC", v.psc), d("KodStatu", "CZ")), d("PlatceDPH", i.dic ? "1" : "0"), d("FyzOsoba", i.ico ? "0" : "1")), r("SeznamPolozek", ...y));
}
function v(t, n) {
	let i = {
		21: t.sazby[21],
		12: t.sazby[12],
		0: t.sazby[0]
	}, a = t.vydej > t.prijem, s = a ? t.vydej : t.prijem, l = e.filter((e) => t.sazby[e].zaklad).map((e, n) => r("NormPolozka", d("Poradi", n + 1), d("Popis", (t.popis || "Prodej za hotové").slice(0, 50)), d("Cena", c(t.sazby[e].zaklad)), d("CenaTyp", "0"), d("SazbaDPH", e), d("PocetMJ", "1")));
	return r("PokDokl", d("Vydej", a ? "1" : "0"), d("Doklad", t.cislo), d("Popis", (t.popis || "Prodej za hotové").slice(0, 50)), d("DatUcPr", t.datum), d("DatVyst", t.datum), d("DatPlat", t.datum), d("DatPln", t.datum), o("Pokl", n.zkratkaPokladny), o("PrKont", n.predkontacePokladny), o("Cleneni", n.cleniDph), d("ZpVypDPH", "1"), d("SSazba", "12"), d("ZSazba", "21"), g(i), d("Celkem", c(s)), d("ZjednD", "0"), l.length ? r("SeznamNormPolozek", ...l) : "");
}
function y(e, t, n, r) {
	let a = m(e, n, r).map((e) => _(e, t)), o = i(e, n, r).map((e) => v(e, t)), s = /* @__PURE__ */ new Date();
	return `<?xml version="1.0" encoding="UTF-8"?>\n<MoneyData${p({
		ICAgendy: t.firma.ico.replace(/\s/g, ""),
		description: `Doklady z IC Office ${n} až ${r}`,
		ExpZkratka: "_FV",
		ExpDate: s.toISOString().slice(0, 10),
		ExpTime: s.toTimeString().slice(0, 8)
	})}>\n` + (a.length ? `<SeznamFaktVyd>\n${a.join("\n")}\n</SeznamFaktVyd>\n` : "") + (o.length ? `<SeznamPokDokl>\n${o.join("\n")}\n</SeznamPokDokl>\n` : "") + "</MoneyData>\n";
}
export { y as moneyXml };
