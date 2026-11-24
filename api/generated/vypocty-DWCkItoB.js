import { i as e } from "./nastaveni-DdJkITgT.js";
import { a as t, d as n, g as r, l as i, m as a, p as o, s, u as c } from "./zaklad-BALOwaPP.js";
// src/lib/vypocty.ts
var l = [
	21,
	12,
	0
];
function u() {
	return {
		21: {
			zaklad: 0,
			dph: 0
		},
		12: {
			zaklad: 0,
			dph: 0
		},
		0: {
			zaklad: 0,
			dph: 0
		}
	};
}
function d(e, t, n, r) {
	let i = t >= 17 ? 21 : t > 0 ? 12 : 0;
	e[i].zaklad = o(e[i].zaklad + n), e[i].dph = o(e[i].dph + r);
}
function f(e) {
	let t = u();
	for (let n of e) for (let e of l) d(t, e, n[e].zaklad, n[e].dph);
	return t;
}
var p = (e, t) => `${i(e)}|${i(t)}`, m = class {
	polozky = /* @__PURE__ */ new Set();
	ceny = /* @__PURE__ */ new Map();
	constructor(t, n) {
		for (let r of t) {
			if (!r.kod || (this.polozky.add(p(r.kod, r.popis)), e(n, r.sklad).vyloucen)) continue;
			let t = i(r.kod), a = this.ceny.get(t) ?? [];
			a.push(r), this.ceny.set(t, a);
		}
		for (let e of this.ceny.values()) e.sort((e, t) => (e.datum + e.cas).localeCompare(t.datum + t.cas));
	}
	jeSkladova(e, t) {
		return !!e && this.polozky.has(p(e, t));
	}
	cena(e, t) {
		let n = this.ceny.get(i(e));
		if (!n?.length) return null;
		let r = n.filter((e) => e.datum <= t), a = [...r].reverse().find((e) => e.smer === "vydej") ?? [...r].reverse().find((e) => e.smer === "prijem") ?? n.find((e) => e.datum > t);
		return a ? {
			cenaMj: a.cenaMjBez,
			zdroj: a.zdroj,
			puvod: a.smer
		} : null;
	}
};
function h(e, t, n) {
	return e.djm ? "djm" : !e.nazev && !e.kod && e.bez === 0 ? "prazdna" : n.polozky[p(e.kod, e.nazev)] || (/^hod/i.test(e.jednotka) ? "vykon" : t.jeSkladova(e.kod, e.nazev) ? "material" : "vykon");
}
function g(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.polozky) {
		let e = t.get(n.fakturaId) ?? [];
		e.push(n), t.set(n.fakturaId, e);
	}
	return e.faktury.map((e) => {
		let n = t.get(e.id) ?? [], r = u();
		if (n.length) for (let t of n) d(r, t.sazba, e.dobropis && t.bez > 0 ? -t.bez : t.bez, e.dobropis && t.dph > 0 ? -t.dph : t.dph);
		else {
			let t = o(e.celkemS - e.celkemBez);
			d(r, e.celkemBez ? Math.round(t / e.celkemBez * 100) : 0, e.celkemBez, t);
		}
		let i = a(l, (e) => r[e].zaklad), s = a(l, (e) => r[e].dph), c = n.length > 0 && (Math.abs(i - e.celkemBez) > .05 || Math.abs(i + s - e.celkemS) > .05);
		return {
			f: e,
			polozky: n,
			rozpis: r,
			bezPolozek: n.length === 0,
			nesouhlasi: c
		};
	});
}
function _(e, t) {
	return t.datumTrzeb === "vystaveni" ? e.vystaveni : e.duzp;
}
function v(e) {
	let t = i(e);
	return t.startsWith("hotov") ? "H" : t.startsWith("kart") || t.includes("karta") ? "K" : t.startsWith("prevod") ? "F" : t.startsWith("dobirk") ? "D" : t.startsWith("zaloh") ? "Z" : e ? e.slice(0, 1).toUpperCase() : "";
}
function y(e) {
	let [t, n] = e.split(":").map(Number);
	return (t || 0) * 60 + (n || 0);
}
function b(e, t, n, i) {
	let s = new m(e.pohyby, t), c = [];
	for (let { f: a, polozky: l, rozpis: u, nesouhlasi: d } of g(e)) {
		let e = _(a, t);
		if (!r(e, n, i)) continue;
		let f = 0, p = 0, m = 0, g = 0, y = 0, b = a.dobropis ? -1 : 1;
		for (let n of l) {
			let r = b * Math.abs(n.bez);
			switch (h(n, s, t)) {
				case "material": {
					p += r;
					let t = s.cena(n.kod, e);
					t ? f += b * Math.abs(n.mnozstvi) * t.cenaMj : y++;
					break;
				}
				case "vykon":
					m += r;
					break;
				case "djm": g += r;
			}
		}
		l.length || (m = a.celkemBez), c.push({
			datum: e,
			zakazka: a.zakazka,
			doklad: a.cislo,
			odberatel: a.zakaznik,
			materialNaklady: o(f),
			materialPc: o(p),
			vykony: o(m),
			djm: o(g),
			dph: o(a.celkemS - a.celkemBez),
			placeno: a.castkaS,
			zaokrouhleni: a.zaokrouhleni,
			forma: v(a.forma),
			rozpis: u,
			bezSkladoveCeny: y,
			nesouhlasi: d,
			zdroje: [a.zdroj, ...l.map((e) => e.zdroj)],
			pokladna: !1
		});
	}
	if (t.zahrnoutPokladnuDoTrzeb) {
		let t = e.pohyby.filter((e) => e.smer === "vydej" && /^prodej/i.test(e.druh) && !/dobropis/i.test(e.poznamka));
		for (let s of e.pokladna) {
			if (s.faktura || s.prijem <= 0 || !r(s.datum, n, i)) continue;
			let e = u();
			for (let t of l) d(e, t, s.sazby[t].zaklad, s.sazby[t].dph);
			let f = a(l, (t) => e[t].zaklad), p = a(l, (t) => e[t].dph), m = t.filter((e) => e.datum === s.datum && Math.abs(y(e.cas) - y(s.cas)) <= 15);
			c.push({
				datum: s.datum,
				zakazka: "",
				doklad: s.cislo,
				odberatel: s.popis || "Prodej za hotové",
				materialNaklady: a(m, (e) => e.bez),
				materialPc: f,
				vykony: 0,
				djm: 0,
				dph: p,
				placeno: s.prijem,
				zaokrouhleni: o(s.prijem - f - p),
				forma: "H",
				rozpis: e,
				bezSkladoveCeny: +!m.length,
				nesouhlasi: !1,
				zdroje: [s.zdroj, ...m.map((e) => e.zdroj)],
				pokladna: !0
			});
		}
	}
	return c.sort((e, t) => e.datum.localeCompare(t.datum) || e.doklad.localeCompare(t.doklad));
}
var x = "2027-01-01";
function S(e, t, n) {
	let a = /* @__PURE__ */ new Map(), s = (e, t, n, r) => {
		let i = a.get(e) ?? {
			datum: e,
			hotove: 0,
			kartou: 0,
			pocet: 0,
			zdroje: []
		};
		i.hotove = o(i.hotove + t), i.kartou = o(i.kartou + n), i.pocet++, i.zdroje.push(r), a.set(e, i);
	};
	for (let i of e.pokladna) r(i.datum, t, n) && (i.prijem || i.vydej) && s(i.datum, o(i.prijem - i.vydej), 0, i.zdroj);
	let c = new Set(e.pokladna.map((e) => e.faktura).filter(Boolean)), l = [];
	for (let a of e.faktury) {
		let e = v(a.forma);
		if (e !== "H" && e !== "K" || c.has(a.cislo)) continue;
		let o = a.zaplaceno || a.vystaveni;
		if (!r(o, t, n)) continue;
		if (i(a.stav).startsWith("nezaplac")) {
			l.push(a.cislo);
			continue;
		}
		let u = a.dobropis ? -Math.abs(a.castkaS) : a.castkaS;
		s(o, e === "H" ? u : 0, e === "K" ? u : 0, a.zdroj);
	}
	return {
		dny: [...a.values()].sort((e, t) => e.datum.localeCompare(t.datum)),
		nezaplacene: l
	};
}
var C = [
	"predchoziInventura",
	"pocatek",
	"prijem",
	"prevodNa",
	"prevodZe",
	"dobropisy",
	"manka",
	"vydej",
	"storno",
	"prodej",
	"neucetni",
	"konec"
];
function w(e) {
	let t = i(e.druh), n = i(e.poznamka);
	return /invent|manko|prebyt/.test(t + " " + n) ? "manka" : t.includes("prevod") ? e.smer === "prijem" ? "prevodNa" : "prevodZe" : e.smer === "prijem" ? "prijem" : n.includes("dobropis") || t.includes("dobropis") ? "dobropisy" : n.includes("storno") || e.bez < 0 ? "storno" : t.startsWith("prodej") ? "prodej" : "vydej";
}
function T(e, t) {
	switch (t) {
		case "prijem":
		case "prevodNa":
		case "storno": return 1;
		case "manka": return e.smer === "prijem" ? 1 : -1;
		default: return -1;
	}
}
function E(e, t) {
	return T(e, t) * Math.abs(e.bez);
}
function D(e) {
	return e || "Bez skladu";
}
function O(t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let a of t.pohyby) {
		let t = D(a.sklad);
		if (e(n, t).vyloucen || r && a.datum > r) continue;
		let o = a.kod || a.popis, s = JSON.stringify([t, o]), c = i.get(s) ?? {
			sklad: t,
			kod: o,
			popis: "",
			prijato: 0,
			vydano: 0,
			zustatek: 0,
			hodnota: 0,
			zdroje: []
		}, l = w(a), u = Math.abs(a.mnozstvi);
		T(a, l) > 0 ? c.prijato += u : c.vydano += u, c.hodnota += E(a, l), a.popis && (c.popis = a.popis), c.zdroje.push(a.zdroj), i.set(s, c);
	}
	return [...i.values()].map((e) => ({
		...e,
		prijato: Math.round(e.prijato * 1e3) / 1e3,
		vydano: Math.round(e.vydano * 1e3) / 1e3,
		zustatek: Math.round((e.prijato - e.vydano) * 1e3) / 1e3,
		hodnota: o(e.hodnota)
	})).sort((e, t) => e.sklad.localeCompare(t.sklad, "cs") || e.kod.localeCompare(t.kod, "cs"));
}
function k(t, n, i, a) {
	let s = /* @__PURE__ */ new Map();
	for (let r of t.pohyby) {
		let t = D(r.sklad);
		if (e(n, t).vyloucen) continue;
		let i = s.get(t) ?? [];
		i.push(r), s.set(t, i);
	}
	let c = [];
	for (let [t, l] of s) {
		let s = e(n, t), u = Object.fromEntries(C.map((e) => [e, 0]));
		u.predchoziInventura = s.pocatecniStav;
		let d = s.pocatecniStav, f = [];
		for (let e of l) {
			let t = w(e);
			if (i && e.datum < i) d += E(e, t);
			else if (r(e.datum, i, a)) {
				let n = E(e, t);
				u[t] = o(u[t] + (t === "manka" ? n : Math.abs(n))), f.push(e.zdroj);
			}
		}
		u.pocatek = o(d), u.konec = o(u.pocatek + u.prijem + u.prevodNa - u.prevodZe - u.dobropisy + u.manka - u.vydej + u.storno - u.prodej + u.neucetni), c.push({
			sklad: t,
			ucet: s.ucet.trim(),
			hodnoty: u,
			zdroje: f
		});
	}
	return c.sort((e, t) => (e.ucet || "￿").localeCompare(t.ucet || "￿") || e.sklad.localeCompare(t.sklad, "cs"));
}
function A(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.mechanici) {
		let e = t.get(n.mechanik) ?? {
			mechanik: n.mechanik,
			zakazky: 0,
			cas: 0,
			prace: 0,
			material: 0,
			ostatni: 0,
			celkem: 0,
			zdroje: [],
			sez: /* @__PURE__ */ new Set()
		};
		e.sez.add(n.zakazka), e.cas = o(e.cas + n.cas), e.prace = o(e.prace + n.prace), e.material = o(e.material + n.material), e.ostatni = o(e.ostatni + n.ostatni), e.zdroje.push(n.zdroj), t.set(n.mechanik, e);
	}
	return [...t.values()].map(({ sez: e, ...t }) => ({
		...t,
		zakazky: e.size,
		celkem: o(t.prace + t.material + t.ostatni)
	})).sort((e, t) => t.prace - e.prace);
}
function j(e, t, n, i) {
	let s = [...e.pokladna].sort((e, t) => (e.datum + e.cas + e.cislo).localeCompare(t.datum + t.cas + t.cislo)), c = t.pocatecniZustatekPokladny, f = [], p = c;
	for (let e of s) n && e.datum < n ? (c = o(c + e.prijem - e.vydej), p = c) : r(e.datum, n, i) && (c = o(c + e.prijem - e.vydej), f.push({
		d: e,
		zustatek: c
	}));
	let m = u();
	for (let { d: e } of f) for (let t of l) d(m, t, e.sazby[t].zaklad, e.sazby[t].dph);
	return {
		radky: f,
		pocatek: p,
		konec: c,
		prijmy: a(f, (e) => e.d.prijem),
		vydaje: a(f, (e) => e.d.vydej),
		rozpis: m
	};
}
function M(e, i, o) {
	let p = g(e).filter((e) => r(e.f.duzp, i, o)), m = e.pokladna.filter((e) => !e.faktura && r(e.datum, i, o)), h = [], _ = u(), v = [];
	for (let { f: e, rozpis: t } of p) {
		let n = a(l, (e) => t[e].zaklad + t[e].dph);
		if (s(e.dic) && Math.abs(n) > 1e4) h.push({
			dicOdberatele: e.dic.replace(/\s/g, "").toUpperCase(),
			evidencniCislo: e.cislo,
			dppd: e.duzp,
			rozpis: t,
			odberatel: e.zakaznik,
			zdroj: e.zdroj
		});
		else {
			for (let e of l) d(_, e, t[e].zaklad, t[e].dph);
			!s(e.dic) && e.ico && Math.abs(n) > 1e4 && v.push(`Faktura ${e.cislo} (${e.zakaznik}) je nad 10 000 Kč a odběratel má IČO ${e.ico}, ale v exportu nemá DIČ. Pokud je plátcem DPH, patří do A.4.`);
		}
	}
	for (let a of e.faktury) !a.duzp || a.duzp >= i || !r(a.vystaveni, i, o) || v.push(`Faktura ${a.cislo} je vystavená ${t(a.vystaveni)}, ale DUZP má ${t(a.duzp)}, takže patří do období ${n(a.duzp.slice(0, 7))} a v tomto podkladu není. Pokud je za ten měsíc kontrolní hlášení už podané, podejte následné (do 5 pracovních dnů od zjištění) a dodatečné přiznání.`);
	let y = e.soubory.filter((e) => e.druh === "faktury" && e.obdobi).map((e) => e.obdobi.do).sort().pop(), b = c(i.slice(0, 7));
	i === b.od && o === b.do && y && y <= o && v.push(`Export vystavených faktur končí dnem vystavení ${t(y)}. Faktury vystavené později s DUZP v tomto měsíci v něm nejsou (IC Office filtruje podle data vystavení). Před podáním kontrolního hlášení načtěte i faktury vystavené do 15 dnů po konci měsíce.`);
	let x = u();
	for (let e of m) for (let t of l) d(x, t, e.sazby[t].zaklad, e.sazby[t].dph);
	for (let e of l) d(_, e, x[e].zaklad, x[e].dph);
	let S = f(p.map((e) => e.rozpis));
	return {
		faktury: p,
		doklady: m,
		a4: h,
		a5: _,
		zFaktur: S,
		zPokladny: x,
		celkem: f([S, x]),
		upozorneni: v
	};
}
export { M as a, A as c, b as d, v as f, S as i, g as l, x as n, j as o, k as r, O as s, l as t, f as u };
