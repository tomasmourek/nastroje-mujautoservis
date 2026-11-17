import { i as e } from "./nastaveni-DdJkITgT.js";
import { a as t, d as n, f as r, h as i, l as a, p as o, s, u as c } from "./zaklad-Xwu_hcf2.js";
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
function d(e, t, n, i) {
	let a = t >= 17 ? 21 : t > 0 ? 12 : 0;
	e[a].zaklad = r(e[a].zaklad + n), e[a].dph = r(e[a].dph + i);
}
function f(e) {
	let t = u();
	for (let n of e) for (let e of l) d(t, e, n[e].zaklad, n[e].dph);
	return t;
}
var p = (e, t) => `${a(e)}|${a(t)}`, m = class {
	polozky = /* @__PURE__ */ new Set();
	ceny = /* @__PURE__ */ new Map();
	constructor(t, n) {
		for (let r of t) {
			if (!r.kod || (this.polozky.add(p(r.kod, r.popis)), e(n, r.sklad).vyloucen)) continue;
			let t = a(r.kod), i = this.ceny.get(t) ?? [];
			i.push(r), this.ceny.set(t, i);
		}
		for (let e of this.ceny.values()) e.sort((e, t) => (e.datum + e.cas).localeCompare(t.datum + t.cas));
	}
	jeSkladova(e, t) {
		return !!e && this.polozky.has(p(e, t));
	}
	cena(e, t) {
		let n = this.ceny.get(a(e));
		if (!n?.length) return null;
		let r = n.filter((e) => e.datum <= t), i = [...r].reverse().find((e) => e.smer === "vydej") ?? [...r].reverse().find((e) => e.smer === "prijem") ?? n.find((e) => e.datum > t);
		return i ? {
			cenaMj: i.cenaMjBez,
			zdroj: i.zdroj,
			puvod: i.smer
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
		let n = t.get(e.id) ?? [], i = u();
		if (n.length) for (let t of n) d(i, t.sazba, e.dobropis && t.bez > 0 ? -t.bez : t.bez, e.dobropis && t.dph > 0 ? -t.dph : t.dph);
		else {
			let t = r(e.celkemS - e.celkemBez);
			d(i, e.celkemBez ? Math.round(t / e.celkemBez * 100) : 0, e.celkemBez, t);
		}
		let a = o(l, (e) => i[e].zaklad), s = o(l, (e) => i[e].dph), c = n.length > 0 && (Math.abs(a - e.celkemBez) > .05 || Math.abs(a + s - e.celkemS) > .05);
		return {
			f: e,
			polozky: n,
			rozpis: i,
			bezPolozek: n.length === 0,
			nesouhlasi: c
		};
	});
}
function _(e, t) {
	return t.datumTrzeb === "vystaveni" ? e.vystaveni : e.duzp;
}
function v(e) {
	let t = a(e);
	return t.startsWith("hotov") ? "H" : t.startsWith("kart") || t.includes("karta") ? "K" : t.startsWith("prevod") ? "F" : t.startsWith("dobirk") ? "D" : t.startsWith("zaloh") ? "Z" : e ? e.slice(0, 1).toUpperCase() : "";
}
function y(e) {
	let [t, n] = e.split(":").map(Number);
	return (t || 0) * 60 + (n || 0);
}
function b(e, t, n, a) {
	let s = new m(e.pohyby, t), c = [];
	for (let { f: o, polozky: l, rozpis: u, nesouhlasi: d } of g(e)) {
		let e = _(o, t);
		if (!i(e, n, a)) continue;
		let f = 0, p = 0, m = 0, g = 0, y = 0, b = o.dobropis ? -1 : 1;
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
		l.length || (m = o.celkemBez), c.push({
			datum: e,
			zakazka: o.zakazka,
			doklad: o.cislo,
			odberatel: o.zakaznik,
			materialNaklady: r(f),
			materialPc: r(p),
			vykony: r(m),
			djm: r(g),
			dph: r(o.celkemS - o.celkemBez),
			placeno: o.castkaS,
			zaokrouhleni: o.zaokrouhleni,
			forma: v(o.forma),
			rozpis: u,
			bezSkladoveCeny: y,
			nesouhlasi: d,
			zdroje: [o.zdroj, ...l.map((e) => e.zdroj)],
			pokladna: !1
		});
	}
	if (t.zahrnoutPokladnuDoTrzeb) {
		let t = e.pohyby.filter((e) => e.smer === "vydej" && /^prodej/i.test(e.druh) && !/dobropis/i.test(e.poznamka));
		for (let s of e.pokladna) {
			if (s.faktura || s.prijem <= 0 || !i(s.datum, n, a)) continue;
			let e = u();
			for (let t of l) d(e, t, s.sazby[t].zaklad, s.sazby[t].dph);
			let f = o(l, (t) => e[t].zaklad), p = o(l, (t) => e[t].dph), m = t.filter((e) => e.datum === s.datum && Math.abs(y(e.cas) - y(s.cas)) <= 15);
			c.push({
				datum: s.datum,
				zakazka: "",
				doklad: s.cislo,
				odberatel: s.popis || "Prodej za hotové",
				materialNaklady: o(m, (e) => e.bez),
				materialPc: f,
				vykony: 0,
				djm: 0,
				dph: p,
				placeno: s.prijem,
				zaokrouhleni: r(s.prijem - f - p),
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
	let o = /* @__PURE__ */ new Map(), s = (e, t, n, i) => {
		let a = o.get(e) ?? {
			datum: e,
			hotove: 0,
			kartou: 0,
			pocet: 0,
			zdroje: []
		};
		a.hotove = r(a.hotove + t), a.kartou = r(a.kartou + n), a.pocet++, a.zdroje.push(i), o.set(e, a);
	};
	for (let a of e.pokladna) i(a.datum, t, n) && (a.prijem || a.vydej) && s(a.datum, r(a.prijem - a.vydej), 0, a.zdroj);
	let c = new Set(e.pokladna.map((e) => e.faktura).filter(Boolean)), l = [];
	for (let r of e.faktury) {
		let e = v(r.forma);
		if (e !== "H" && e !== "K" || c.has(r.cislo)) continue;
		let o = r.zaplaceno || r.vystaveni;
		if (!i(o, t, n)) continue;
		if (a(r.stav).startsWith("nezaplac")) {
			l.push(r.cislo);
			continue;
		}
		let u = r.dobropis ? -Math.abs(r.castkaS) : r.castkaS;
		s(o, e === "H" ? u : 0, e === "K" ? u : 0, r.zdroj);
	}
	return {
		dny: [...o.values()].sort((e, t) => e.datum.localeCompare(t.datum)),
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
	let t = a(e.druh), n = a(e.poznamka);
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
function O(t, n, i) {
	let a = /* @__PURE__ */ new Map();
	for (let r of t.pohyby) {
		let t = D(r.sklad);
		if (e(n, t).vyloucen || i && r.datum > i) continue;
		let o = r.kod || r.popis, s = JSON.stringify([t, o]), c = a.get(s) ?? {
			sklad: t,
			kod: o,
			popis: "",
			prijato: 0,
			vydano: 0,
			zustatek: 0,
			hodnota: 0,
			zdroje: []
		}, l = w(r), u = Math.abs(r.mnozstvi);
		T(r, l) > 0 ? c.prijato += u : c.vydano += u, c.hodnota += E(r, l), r.popis && (c.popis = r.popis), c.zdroje.push(r.zdroj), a.set(s, c);
	}
	return [...a.values()].map((e) => ({
		...e,
		prijato: Math.round(e.prijato * 1e3) / 1e3,
		vydano: Math.round(e.vydano * 1e3) / 1e3,
		zustatek: Math.round((e.prijato - e.vydano) * 1e3) / 1e3,
		hodnota: r(e.hodnota)
	})).sort((e, t) => e.sklad.localeCompare(t.sklad, "cs") || e.kod.localeCompare(t.kod, "cs"));
}
function k(t, n, a, o) {
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
			if (a && e.datum < a) d += E(e, t);
			else if (i(e.datum, a, o)) {
				let n = E(e, t);
				u[t] = r(u[t] + (t === "manka" ? n : Math.abs(n))), f.push(e.zdroj);
			}
		}
		u.pocatek = r(d), u.konec = r(u.pocatek + u.prijem + u.prevodNa - u.prevodZe - u.dobropisy + u.manka - u.vydej + u.storno - u.prodej + u.neucetni), c.push({
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
		e.sez.add(n.zakazka), e.cas = r(e.cas + n.cas), e.prace = r(e.prace + n.prace), e.material = r(e.material + n.material), e.ostatni = r(e.ostatni + n.ostatni), e.zdroje.push(n.zdroj), t.set(n.mechanik, e);
	}
	return [...t.values()].map(({ sez: e, ...t }) => ({
		...t,
		zakazky: e.size,
		celkem: r(t.prace + t.material + t.ostatni)
	})).sort((e, t) => t.prace - e.prace);
}
function j(e, t, n, a) {
	let s = [...e.pokladna].sort((e, t) => (e.datum + e.cas + e.cislo).localeCompare(t.datum + t.cas + t.cislo)), c = t.pocatecniZustatekPokladny, f = [], p = c;
	for (let e of s) n && e.datum < n ? (c = r(c + e.prijem - e.vydej), p = c) : i(e.datum, n, a) && (c = r(c + e.prijem - e.vydej), f.push({
		d: e,
		zustatek: c
	}));
	let m = u();
	for (let { d: e } of f) for (let t of l) d(m, t, e.sazby[t].zaklad, e.sazby[t].dph);
	return {
		radky: f,
		pocatek: p,
		konec: c,
		prijmy: o(f, (e) => e.d.prijem),
		vydaje: o(f, (e) => e.d.vydej),
		rozpis: m
	};
}
function M(e, r, a) {
	let p = g(e).filter((e) => i(e.f.duzp, r, a)), m = e.pokladna.filter((e) => !e.faktura && i(e.datum, r, a)), h = [], _ = u(), v = [];
	for (let { f: e, rozpis: t } of p) {
		let n = o(l, (e) => t[e].zaklad + t[e].dph);
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
	for (let o of e.faktury) !o.duzp || o.duzp >= r || !i(o.vystaveni, r, a) || v.push(`Faktura ${o.cislo} je vystavená ${t(o.vystaveni)}, ale DUZP má ${t(o.duzp)}, takže patří do období ${n(o.duzp.slice(0, 7))} a v tomto podkladu není. Pokud je za ten měsíc kontrolní hlášení už podané, podejte následné (do 5 pracovních dnů od zjištění) a dodatečné přiznání.`);
	let y = e.soubory.filter((e) => e.druh === "faktury" && e.obdobi).map((e) => e.obdobi.do).sort().pop(), b = c(r.slice(0, 7));
	r === b.od && a === b.do && y && y <= a && v.push(`Export vystavených faktur končí dnem vystavení ${t(y)}. Faktury vystavené později s DUZP v tomto měsíci v něm nejsou (IC Office filtruje podle data vystavení). Před podáním kontrolního hlášení načtěte i faktury vystavené do 15 dnů po konci měsíce.`);
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
