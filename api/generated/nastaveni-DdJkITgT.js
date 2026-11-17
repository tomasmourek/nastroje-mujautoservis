// src/lib/nastaveni.ts
var e = (e) => e === "jiny" ? "isdoc" : e, t = {
	firma: {
		nazev: "",
		ulice: "",
		cisloPopisne: "",
		obec: "",
		psc: "",
		ico: "",
		dic: "",
		ufo: "",
		pracufo: "",
		email: "",
		telefon: "",
		sestavil: "",
		cisloUctu: "",
		kodBanky: ""
	},
	sklady: {},
	polozky: {},
	pocatecniZustatekPokladny: 0,
	datumTrzeb: "duzp",
	zahrnoutPokladnuDoTrzeb: !0,
	predkontaceFaktur: "",
	predkontacePokladny: "",
	zkratkaPokladny: "",
	cleniDph: "",
	vychoziObdobi: "den",
	ucetniProgram: "pohoda",
	odeslani: {
		komu: "",
		prilohy: [
			"pdf",
			"xlsx",
			"skladoveDoklady"
		],
		klic: "",
		automaticky: !1,
		cas: "07:00",
		obdobi: "den"
	}
};
function n(e) {
	return /test|ukázk|ukazk|průvodce|pruvodce|demo/i.test(e);
}
function r(e, t) {
	return e.sklady[t] ?? {
		ucet: "",
		pocatecniStav: 0,
		vyloucen: n(t)
	};
}
function i(e) {
	return [`${e.ulice} ${e.cisloPopisne}`.trim(), `${e.psc} ${e.obec}`.trim()].filter(Boolean).join(", ");
}
export { r as i, i as n, e as r, t };
