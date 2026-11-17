import { r as e } from "./rolldown-runtime-DfEuXgQw.js";
import { a as t, f as n, h as r, i, l as a, m as o, o as s, p as c, r as l, t as u } from "./zaklad-Xwu_hcf2.js";
import { r as d, t as f } from "./nastaveni-DdJkITgT.js";
import { c as p, d as m, n as h, t as g, u as _ } from "./xml-BtYWPW0O.js";
import { a as v } from "./vypocty-cReu2eaY.js";
import { i as y, n as b, o as x, r as S } from "./sestavy-CtwwVNT8.js";
import * as C from "xlsx";
// src/lib/model.ts
var w = {
	faktury: "Vystavené faktury",
	polozky: "Položky vystavených faktur",
	pokladna: "Pokladna",
	naskladneni: "Naskladněné zboží",
	vydej: "Vydané zboží",
	mechanici: "Mechanici a zakázky",
	skladoveDoklady: "Příjemky a výdejky ze skladu"
}, T = class {
	mapa = /* @__PURE__ */ new Map();
	constructor(e) {
		e.forEach((e, t) => {
			let n = a(e);
			n && !this.mapa.has(n) && this.mapa.set(n, t);
		});
	}
	ma(...e) {
		return e.every((e) => this.mapa.has(e));
	}
	i(e) {
		return this.mapa.get(e) ?? -1;
	}
	hodnota(e, t) {
		let n = this.i(t);
		return n >= 0 ? e[n] ?? null : null;
	}
	vsechny() {
		return [...this.mapa.entries()];
	}
};
function E(e) {
	return e.ma("cislo faktury", "datum duzp") ? "faktury" : e.ma("cislo faktury", "nazev", "mnozstvi") ? "polozky" : e.ma("c. dokladu", "prijem", "vydej") ? "pokladna" : e.ma("cislo prijemky", "kod zbozi") ? "naskladneni" : e.ma("cislo vydejky", "kod zbozi") ? "vydej" : e.ma("zakazka", "prace", "prace cas") ? "mechanici" : e.ma("datum", "typ", "pridal / vydal", "hodnota [bez dph]", "hodnota [s dph]") ? "skladoveDoklady" : null;
}
function D(e, t) {
	let n = t.i("#") >= 0 ? e[t.i("#")] : e[t.i("id")];
	return n != null && /^\d+$/.test(String(n).trim());
}
var O = /^(|celkem za:|0([.,]0+)?(\s*kč)?|obsahuje všechny položky .*)$/i, k = [
	[/^Vystavene_faktury_polozky_/i, "polozky"],
	[/^Vystavene_faktury_/i, "faktury"],
	[/^Pokladna_/i, "pokladna"],
	[/^Naskladnene_zbozi_/i, "naskladneni"],
	[/^Vydane_zbozi_/i, "vydej"],
	[/^Mechanici_zakazky_/i, "mechanici"],
	[/^Prijemky_vydejky_/i, "skladoveDoklady"]
];
function ee(e) {
	let t = /(\d{4}-\d{2}-\d{2})[_ -]+(\d{4}-\d{2}-\d{2})/.exec(e);
	return t ? {
		od: t[1],
		do: t[2]
	} : void 0;
}
function te(e, t, n) {
	let r = [];
	return e.forEach((e, a) => {
		if (!D(e, t)) return;
		let s = (n) => t.hodnota(e, n), c = o(s("typ")), u = /dobropis|opravn/i.test(c), d = (e) => u && e > 0 ? -e : e;
		r.push({
			id: o(s("id")),
			cislo: o(s("cislo faktury")),
			forma: o(s("forma uhrady")),
			typ: c,
			vs: o(s("variabilni symbol")),
			zakaznik: o(s("zakaznik")),
			ico: o(s("ico")),
			dic: o(s("dic")),
			adresa: o(s("adresa")).replace(/^[\s,]+$/, ""),
			ucet: o(s("ucet")),
			popis: o(s("popis")),
			vystaveni: i(s("datum vystaveni")),
			splatnost: i(s("datum splatnosti")),
			duzp: i(s("datum duzp")) || i(s("datum vystaveni")),
			duzpChybi: !i(s("datum duzp")),
			zaplaceno: i(s("datum zaplaceni")),
			djmSDph: d(l(s("djm [s dph]"))),
			celkemBez: d(l(s("celkem [bez dph]"))),
			celkemS: d(l(s("celkem [s dph]"))),
			zaokrouhleni: l(s("zaukrouhleni") ?? s("zaokrouhleni")),
			castkaBez: d(l(s("castka [bez dph]"))),
			castkaS: d(l(s("castka [s dph]"))),
			castecnaUhrada: l(s("castecna uh. [kc]")),
			stav: o(s("stav")),
			zakazka: o(s("cislo zakazky")),
			dobropis: u,
			zdroj: n(a)
		});
	}), r;
}
function ne(e, t, r, i) {
	let s = [];
	return e.forEach((e, c) => {
		if (!D(e, t)) return;
		let u = (n) => t.hodnota(e, n), d = {
			fakturaId: o(u("id")),
			cisloFaktury: o(u("cislo faktury")),
			zdroj: r(c)
		};
		if (a(u("forma uhrady")) === "djm") {
			i.pocet++;
			let e = l(u("sleva [%]")), t = l(u("cena mj s dph"));
			s.push({
				...d,
				nazev: o(u("datum vystaveni")) || "Drobný jednicový materiál",
				kod: "DJM",
				mnozstvi: 1,
				jednotka: "",
				sazba: l(u("mnozstvi")) || 21,
				sleva: 0,
				cenaMjS: l(u("celkova cena bez dph")),
				bez: e,
				dph: t,
				s: l(u("celkova cena bez dph")) || n(e + t),
				djm: !0
			});
			return;
		}
		let f = o(u("nazev")), p = o(u("kod"));
		s.push({
			...d,
			nazev: f,
			kod: p,
			mnozstvi: l(u("mnozstvi")),
			jednotka: o(u("jednotka")),
			sazba: l(u("dph")),
			sleva: l(u("sleva [%]")),
			cenaMjS: l(u("cena mj s dph")),
			bez: l(u("celkova cena bez dph")),
			dph: l(u("dph celkem")),
			s: l(u("celkova cena s dph")),
			djm: a(p) === "djm" || a(f) === "drobny jednicovy material"
		});
	}), s;
}
function re(e, t, n) {
	let r = [], a = (e, n) => ({
		zaklad: l(t.hodnota(e, `dph ${n}% - zaklad`)),
		dph: l(t.hodnota(e, `dph ${n}% - dph`)),
		celkem: l(t.hodnota(e, `dph ${n}% - celkem`))
	});
	return e.forEach((e, s) => {
		if (!D(e, t)) return;
		let c = t.hodnota(e, "datum a cas");
		r.push({
			datum: i(c),
			cas: u(c),
			cislo: o(t.hodnota(e, "c. dokladu")),
			popis: o(t.hodnota(e, "popis")),
			faktura: o(t.hodnota(e, "faktura")),
			sazby: {
				0: a(e, 0),
				12: a(e, 12),
				21: a(e, 21)
			},
			prijem: l(t.hodnota(e, "prijem")),
			vydej: l(t.hodnota(e, "vydej")),
			zdroj: n(s)
		});
	}), r;
}
function ie(e, t, n, r) {
	let a = [];
	return e.forEach((e, s) => {
		if (!D(e, t)) return;
		let c = (n) => t.hodnota(e, n), d = c("datum a cas");
		a.push({
			smer: r,
			datum: i(d),
			cas: u(d),
			druh: o(c(r === "prijem" ? "nazev pohybu" : "typ")),
			doklad: o(c(r === "prijem" ? "cislo prijemky" : "cislo vydejky")),
			kod: o(c("kod zbozi")),
			popis: o(c("popis zbozi")),
			dodavatel: o(c("dodavatel")),
			mnozstvi: l(c("mnozstvi")),
			sklad: o(c("sklad")),
			cenaMjBez: l(c("cena mj bez dph")),
			cenaMjS: l(c("cena mj s dph")),
			bez: l(c("celkem bez dph")),
			s: l(c("celkem s dph")),
			poznamka: o(c("poznamka")),
			zdroj: n(s)
		});
	}), a;
}
function ae(e, t, n, r) {
	let i = [];
	return e.forEach((e, a) => {
		if (!D(e, t)) return;
		let s = (n) => t.hodnota(e, n);
		i.push({
			mechanik: r,
			zakazka: o(s("zakazka")),
			material: l(s("material")),
			prace: l(s("prace")),
			cas: l(s("prace cas")),
			ostatni: l(s("ostatni")),
			zdroj: n(a)
		});
	}), i;
}
function oe(e) {
	let t = typeof e == "number" ? C.SSF.parse_date_code(e) : null, n = t ? `${String(t.y).padStart(4, "0")}-${String(t.m).padStart(2, "0")}-${String(t.d).padStart(2, "0")}` : i(e);
	if (!n) return "";
	let [r, a, o] = n.split("-").map(Number), s = new Date(Date.UTC(r, a - 1, o));
	return s.getUTCFullYear() === r && s.getUTCMonth() === a - 1 && s.getUTCDate() === o ? n : "";
}
function se(e, t, n, r) {
	let i = [];
	return e.forEach((e, s) => {
		if (!D(e, t)) return;
		let c = (n) => t.hodnota(e, n), u = a(c("typ")), d = u === "vratka ze zakazky / prodeje", f = u === "prijem" || u === "prijemka" || d ? "prijem" : u === "vydej" || u === "vydejka" ? "vydej" : null, p = oe(c("datum")), m = n(s);
		f || r.push(`Řádek ${m.radek}: neznámý typ skladového dokladu „${o(c("typ"))}“, řádek nebyl načten.`), p || r.push(`Řádek ${m.radek}: neplatné datum skladového dokladu „${o(c("datum"))}“, řádek nebyl načten.`), f && p && i.push({
			id: o(c("id pohybu")),
			cislo: o(c("cislo dokladu")),
			datum: p,
			smer: f,
			typ: d ? "Vratka ze zakázky / prodeje" : f === "prijem" ? "Příjem" : "Výdej",
			partner: o(c("klient")),
			vydal: o(c("pridal / vydal")),
			nazev: o(c("nazev")),
			zakazka: o(c("zakazka")),
			faktura: o(c("faktura")),
			objednavka: o(c("objednavka")),
			bez: l(c("hodnota [bez dph]")),
			s: l(c("hodnota [s dph]")),
			zdroj: m
		});
	}), i.some((e) => !e.id && !e.cislo) && r.push("Export příjemek a výdejek neobsahuje ID pohybu ani číslo dokladu. Opakované řádky rozlišujeme podle celého obsahu, protože pořadové # není stálý identifikátor. Dva různé doklady se zcela shodným obsahem nelze odlišit; pro přesné rozlišení načtěte podklady přes doplněk."), i;
}
function A(e, t, n) {
	for (let r of e) {
		let e = r.findIndex((e) => a(e).startsWith("celkem za"));
		if (e < 0) continue;
		let i = r.slice(e + 1).map(l).find((e) => e !== 0);
		if (i !== void 0 && Math.abs(i - t) > .05 + n * .005) return `Součet řádků (${t.toFixed(2)} Kč bez DPH) nesouhlasí s patičkou souboru (${i.toFixed(2)} Kč). Export může být neúplný.`;
	}
	return null;
}
function j(e, t) {
	let n = C.read(t, {
		type: "array",
		cellDates: !1,
		raw: !0
	}), r = {
		info: {
			nazev: e,
			druh: "faktury",
			pocet: 0,
			obdobi: ee(e),
			varovani: []
		},
		faktury: [],
		polozky: [],
		pokladna: [],
		pohyby: [],
		mechanici: [],
		skladoveDoklady: []
	}, i = null, o = { pocet: 0 };
	for (let t of n.SheetNames) {
		let s = C.utils.sheet_to_json(n.Sheets[t], {
			header: 1,
			raw: !0,
			defval: null,
			blankrows: !0
		}), c = s.findIndex((e) => e.some((e) => ["#", "id"].includes(a(e))));
		if (c < 0) continue;
		let l = new T(s[c]), u = E(l);
		if (!u) continue;
		if (i && u !== i) {
			r.info.varovani.push(`List „${t}“ má jiný druh dat (${u}) a byl přeskočen.`);
			continue;
		}
		i = u;
		let d = s.slice(c + 1), f = (n) => ({
			soubor: e,
			list: t,
			radek: c + 2 + n
		});
		switch (u) {
			case "faktury":
				r.faktury.push(...te(d, l, f));
				break;
			case "polozky":
				r.polozky.push(...ne(d, l, f, o));
				break;
			case "pokladna":
				r.pokladna.push(...re(d, l, f));
				break;
			case "naskladneni":
			case "vydej": {
				let e = ie(d, l, f, u === "naskladneni" ? "prijem" : "vydej");
				r.pohyby.push(...e);
				let t = A(d, e.reduce((e, t) => e + t.bez, 0), e.length);
				t && r.info.varovani.push(t);
				break;
			}
			case "mechanici":
				r.mechanici.push(...ae(d, l, f, t.trim()));
				break;
			case "skladoveDoklady": r.skladoveDoklady.push(...se(d, l, f, r.info.varovani));
		}
	}
	let s = n.SheetNames.every((e) => C.utils.sheet_to_json(n.Sheets[e], {
		header: 1,
		defval: null
	}).flat().every((e) => e === null || O.test(String(e).trim())));
	if (!i && s && (i = k.find(([t]) => t.test(e))?.[1] ?? null, i && r.info.varovani.push("Export je prázdný, za toto období v IC Office nejsou žádné záznamy.")), !i) throw Error(`Soubor „${e}“ nevypadá jako export z IC Office. Očekávám záhlaví faktur, položek faktur, pokladny, naskladněného nebo vydaného zboží, příjemek a výdejek či mechaniků.`);
	return r.info.druh = i, r.info.pocet = r.faktury.length + r.polozky.length + r.pokladna.length + r.pohyby.length + r.mechanici.length + r.skladoveDoklady.length, o.pocet && r.info.varovani.push(`${o.pocet} řádků drobného jednicového materiálu mělo v exportu posunuté sloupce; načteny opravené.`), r;
}
function M(e, t) {
	let n = /* @__PURE__ */ new Set();
	return e.filter((e) => {
		let r = t(e);
		return !n.has(r) && (n.add(r), !0);
	});
}
function N(e) {
	let t = (e) => JSON.stringify([
		e.smer,
		e.cislo,
		e.datum
	]), n = (e) => JSON.stringify([
		e.smer,
		e.typ ?? (e.smer === "prijem" ? "Příjem" : "Výdej"),
		e.datum,
		e.partner,
		e.vydal,
		e.nazev,
		e.zakazka,
		e.faktura,
		e.objednavka,
		e.bez,
		e.s
	]), r = M(e.filter((e) => e.id), (e) => e.id), i = new Set(r.filter((e) => e.cislo).map(t)), a = M(e.filter((e) => !e.id && e.cislo && !i.has(t(e))), t), o = new Set([...r, ...a].map(n)), s = M(e.filter((e) => !e.id && !e.cislo && !o.has(n(e))), n);
	return [
		...r,
		...a,
		...s
	];
}
function ce(e) {
	let t = M(e.flatMap((e) => e.faktury), (e) => e.id || e.cislo), n = /* @__PURE__ */ new Map();
	for (let t of e) for (let e of t.polozky) n.has(e.fakturaId) || n.set(e.fakturaId, t.info.nazev);
	let r = e.flatMap((e) => e.polozky.filter((t) => n.get(t.fakturaId) === e.info.nazev)), i = M(e.flatMap((e) => e.pokladna), (e) => `${e.cislo}|${e.datum}`), a = M(e.flatMap((e) => e.pohyby), (e) => [
		e.smer,
		e.datum,
		e.cas,
		e.kod,
		e.doklad,
		e.mnozstvi,
		e.bez,
		e.sklad,
		e.druh
	].join("|")), o = M(e.flatMap((e) => e.mechanici), (e) => `${e.mechanik}|${e.zakazka}|${e.prace}|${e.material}|${e.cas}`), s = N(e.flatMap((e) => e.skladoveDoklady));
	return {
		soubory: e.map((e) => e.info),
		faktury: t,
		polozky: r,
		pokladna: i,
		pohyby: a,
		mechanici: o,
		skladoveDoklady: s
	};
}
// src/lib/export/kh.ts
function le(e) {
	let t = e.firma, n = [];
	return /^\d{8,10}$/.test(s(t.dic)) || n.push({
		pole: "dic",
		zprava: "DIČ firmy (CZ a 8–10 číslic)"
	}), /^\d{3}$/.test(t.ufo) || n.push({
		pole: "ufo",
		zprava: "kód finančního úřadu (3 číslice)"
	}), t.pracufo && !/^\d{4}$/.test(t.pracufo) && n.push({
		pole: "pracufo",
		zprava: "kód územního pracoviště má 4 číslice"
	}), n;
}
function ue(e, r, i, a, o = "B") {
	let c = v(e, i, a), l = r.firma, [u, d] = i.split("-"), f = i.slice(0, 7) === a.slice(0, 7), p = (e) => e ? h(e) : void 0, m = (e) => ({
		zakl_dane1: p(e[21].zaklad),
		dan1: p(e[21].dph),
		zakl_dane2: p(e[12].zaklad),
		dan2: p(e[12].dph)
	}), _ = l.sestavil.trim().split(/\s+/), y = [];
	y.push(`<VetaD${g({
		dokument: "KH1",
		k_uladis: "DPH",
		khdph_forma: o,
		rok: u,
		mesic: f ? String(Number(d)) : void 0,
		zdobd_od: f ? void 0 : t(i),
		zdobd_do: f ? void 0 : t(a),
		d_poddp: t((/* @__PURE__ */ new Date()).toISOString().slice(0, 10))
	})}/>`), y.push(`<VetaP${g({
		c_ufo: l.ufo,
		c_pracufo: l.pracufo,
		dic: s(l.dic),
		typ_ds: "P",
		zkrobchjm: l.nazev.slice(0, 255),
		ulice: l.ulice.slice(0, 38),
		c_pop: /^\d{1,6}$/.test(l.cisloPopisne) ? l.cisloPopisne : void 0,
		naz_obce: l.obec.slice(0, 48),
		psc: l.psc.replace(/\s/g, ""),
		stat: "ČESKÁ REPUBLIKA",
		email: l.email,
		c_telef: l.telefon.replace(/\s/g, "").slice(0, 14),
		sest_jmeno: _.length > 1 ? _.slice(0, -1).join(" ").slice(0, 20) : void 0,
		sest_prijmeni: _.at(-1)?.slice(0, 36),
		sest_telef: l.telefon.replace(/\s/g, "").slice(0, 14)
	})}/>`), c.a4.forEach((e, n) => y.push(`<VetaA4${g({
		c_radku: n + 1,
		dic_odb: s(e.dicOdberatele),
		c_evid_dd: e.evidencniCislo.slice(0, 60),
		dppd: t(e.dppd),
		...m(e.rozpis),
		kod_rezim_pl: "0",
		zdph_44: "N"
	})}/>`)), (c.a5[21].zaklad || c.a5[12].zaklad) && y.push(`<VetaA5${g(m(c.a5))}/>`);
	let b = n(c.a4.reduce((e, t) => e + t.rozpis[21].zaklad, 0) + c.a5[21].zaklad), x = n(c.a4.reduce((e, t) => e + t.rozpis[12].zaklad, 0) + c.a5[12].zaklad);
	return y.push(`<VetaC${g({
		obrat23: h(b),
		obrat5: h(x)
	})}/>`), `<?xml version="1.0" encoding="UTF-8"?>
<Pisemnost nazevSW="Ucetni sestavy IC Office" verzeSW="1.0">
<DPHKH1 verzePis="03.01">\n${y.join("\n")}\n</DPHKH1>\n</Pisemnost>\n`;
}
// src/lib/export/stazeni.ts
function de(e) {
	return e.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
// src/lib/skladove-prilohy.ts
var P = 10485760, F = /^Skladovy_doklad_([1-9]\d*)\.(?:pdf|html)$/, I = (e) => e.name.endsWith(".html"), L = (e) => `${I(e) ? "tiskove_podklady" : "originaly"}/${e.name}`;
function R(e) {
	return F.exec(e.name)?.[1];
}
async function z(e, t) {
	let n = R(e);
	if (!n) throw Error("Podklad skladového dokladu nemá platný název z doplňku.");
	if (e.size > P) throw Error(`Skladový podklad „${e.name}“ překračuje velikost 10 MiB.`);
	if (I(e)) {
		let r = await e.text(), i = `<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'"><title>Skladový doklad ${n}</title></head><body><p>Tiskový podklad z IC Office. Originální PDF není dostupné (HTTP 500). ID pohybu: ${n}.</p>`;
		if (!r.startsWith(i) || !r.endsWith("</body></html>")) throw Error(`Soubor „${e.name}“ není ověřený tiskový podklad z doplňku.`);
		let a = r.slice(i.length, -14), o = /^<\/?(?:div|p|span|b|strong|i|em|thead|tbody|tfoot|tr)>$|^<br>$|^<table border="1">$|^<\/table>$|^<(?:td|th)(?: colspan="[1-9]\d{0,2}")?(?: rowspan="[1-9]\d{0,2}")?>$|^<\/(?:td|th)>$/;
		if (a.replace(/<[^>]*>/g, (e) => o.test(e) ? "" : "<").includes("<") || !a.startsWith("<div>") || !a.endsWith("</div>") || !a.includes("<table border=\"1\">")) throw Error(`Soubor „${e.name}“ obsahuje nepovolené nebo neúplné HTML.`);
		let s = {
			tag: "",
			obsah: [],
			deti: []
		}, c = [s];
		for (let [t] of a.matchAll(/<[^>]*>|[^<]+/g)) {
			if (!t.startsWith("<")) {
				c.at(-1).obsah.push(t.replace(/&quot;/g, "\"").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&"));
				continue;
			}
			let n = /^<\/?([a-z]+)/.exec(t)[1];
			if (t.startsWith("</")) {
				if (c.length < 2 || c.pop().tag !== n) throw Error(`Soubor „${e.name}“ má neúplnou strukturu HTML.`);
			} else {
				let e = {
					tag: n,
					obsah: [],
					deti: []
				};
				c.at(-1).deti.push(e), c.at(-1).obsah.push(e), n !== "br" && c.push(e);
			}
		}
		if (c.length !== 1 || s.deti.length !== 1) throw Error(`Soubor „${e.name}“ má neúplnou strukturu HTML.`);
		let l = (e) => e.tag === "br" ? "\n" : e.obsah.map((e) => typeof e == "string" ? e : l(e)).join(""), u = (e) => e ? l(e).replace(/\s+/g, " ").trim() : "", d = s.deti[0], f = d.deti.filter((e) => e.tag === "table"), p = (e) => e.deti.flatMap((e) => e.tag === "tr" ? [e] : [
			"tbody",
			"thead",
			"tfoot"
		].includes(e.tag) ? p(e) : []), m = (e) => e.deti.filter((e) => e.tag === "td" || e.tag === "th"), h = f.map(p).filter((e) => JSON.stringify(e[0] && m(e[0]).map(u)) === JSON.stringify([
			"Název",
			"Kód",
			"Množství",
			"MJ",
			"J.Cena",
			"Cena",
			"%DPH",
			"DPH",
			"Celkem"
		]));
		if (h.length !== 1 || h[0].length < 2 || h[0].some((e) => m(e).length !== 9)) throw Error(`Soubor „${e.name}“ nemá úplnou tabulku položek.`);
		let g = f.flatMap(p).map(m), _ = g.filter((e) => u(e[0]) === "Datum příjemky/výdejky:"), v = g.filter((e) => e.length === 9 && u(e[0]) === "Celkem"), y = (t) => {
			let n = t.replace(/\s/g, "").replace(",", ".");
			if (!/^-?\d+(?:\.\d{1,2})?$/.test(n)) throw Error(`Soubor „${e.name}“ má neplatné částky.`);
			return Math.round(Number(n) * 100);
		}, b = u(d.deti[0]);
		if (!/^Skladová (?:příjemka|výdejka) č\. .+$/.test(b) || _.length !== 1 || !/^\d{2}\.\d{2}\.\d{4}$/.test(u(_[0][1])) || v.length !== 1) throw Error(`Soubor „${e.name}“ nemá úplné označení dokladu a součty.`);
		let x = y(u(v[0][5])), S = y(u(v[0][8])), C = h[0].slice(1), w = Math.ceil(C.length / 2);
		for (let t of [
			5,
			7,
			8
		]) {
			let n = C.reduce((e, n) => e + y(u(m(n)[t])), 0);
			if (Math.abs(n - y(u(v[0][t]))) > w) throw Error(`Soubor „${e.name}“ má položkové částky, které nesouhlasí se součty.`);
		}
		if (t) {
			let e = t.datum.split("-").reverse().join("."), r = t.smer === "vydej" ? "výdejka" : "příjemka";
			if (t.id !== n || b !== `Skladová ${r} č. ${t.cislo}` || u(_[0][1]) !== e || x !== Math.round(t.bez * 100) || S !== Math.round(t.s * 100)) throw Error(`Pohyb ${n}: tiskový podklad nesouhlasí s číslem, datem nebo částkami souhrnu.`);
		}
		return;
	}
	let r = new Uint8Array(await e.slice(0, 5).arrayBuffer());
	if (String.fromCharCode(...r) !== "%PDF-") throw Error(`Soubor „${e.name}“ není platný podklad PDF.`);
}
function B(e, t) {
	return e.skladoveDoklady.filter((e) => r(e.datum, t.od, t.do));
}
function V(e, t, n) {
	let r = new Set(B(e, n).map((e) => e.id).filter(Boolean)), i = /* @__PURE__ */ new Map();
	for (let e of t) {
		let t = R(e);
		t && r.has(t) && (!i.has(t) || !I(e) || I(i.get(t))) && i.set(t, e);
	}
	return [...i.values()];
}
function H(e, t, n) {
	let r = new Set(V(e, t, n).map((e) => R(e)));
	return [...new Set(B(e, n).map((e) => e.id).filter(Boolean))].filter((e) => !r.has(e)).length;
}
function fe(e) {
	let t = typeof e == "number" ? e.toFixed(2).replace(".", ",") : e;
	return typeof e == "string" && /^[\s\uFEFF]*[=+\-@]/.test(t) && (t = `'${t}`), `"${t.replace(/"/g, "\"\"")}"`;
}
function U(e, t) {
	let n = new Map(t.map((e) => [R(e), e])), r = [[
		"Druh řádku",
		"Typ",
		"Datum",
		"Číslo dokladu",
		"ID pohybu",
		"Partner",
		"Přidal / Vydal",
		"Název",
		"Zakázka",
		"Faktura",
		"Objednávka",
		"Bez DPH",
		"S DPH",
		"Podklad",
		"Poznámka"
	]];
	for (let t of e) {
		let e = n.get(t.id);
		r.push([
			"Doklad",
			t.typ ?? (t.smer === "prijem" ? "Příjem" : "Výdej"),
			t.datum,
			t.cislo,
			t.id,
			t.partner,
			t.vydal,
			t.nazev,
			t.zakazka,
			t.faktura,
			t.objednavka,
			t.bez,
			t.s,
			e ? L(e) : "",
			t.id ? e && I(e) ? "Úplný tiskový podklad HTML; originální PDF v IC Office selhalo (HTTP 500)." : "" : "Ruční export bez ID pohybu; originál PDF nelze jednoznačně přiřadit."
		]);
	}
	for (let t of ["prijem", "vydej"]) {
		let n = e.filter((e) => e.smer === t);
		r.push([
			"Součet",
			t === "prijem" ? "Součet příjemek" : "Součet výdejek",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			c(n, (e) => e.bez),
			c(n, (e) => e.s),
			"",
			""
		]);
	}
	return `\uFEFF${r.map((e) => e.map(fe).join(";")).join("\r\n")}\r\n`;
}
async function pe(t, n, r) {
	let i = H(t, n, r);
	if (i) throw Error(`Chybí ${i} podkladů skladových dokladů za vybrané období. Načtěte podklady z IC Office znovu.`);
	let a = V(t, n, r), o = B(t, r), { default: s } = await import("./jszip.min-Dw-Oh1vc.js").then((t) => /* @__PURE__ */ e(t.default, 1)), c = new s();
	for (let e of a) await z(e, o.find((t) => t.id === R(e))), c.file(L(e), await e.arrayBuffer());
	c.file("souhrn_prijemek_vydejek.csv", U(o, a));
	let l = o.filter((e) => !e.id).length, u = a.filter(I).length;
	return c.file("informace.txt", [
		`Příjemky a výdejky ze skladu za období ${r.od} až ${r.do}.`,
		`Počet dokladů v souhrnu: ${o.length}. Počet originálních PDF: ${a.length - u}. Počet náhradních tiskových podkladů HTML: ${u}.`,
		l ? `${l} dokladů pochází z ručního exportu bez ID pohybu. Jsou zahrnuté pouze v CSV; originály PDF k nim nelze jednoznačně přiřadit.` : "Všechny doklady v souhrnu mají přiložený podklad.",
		u ? "Tiskové podklady HTML nahrazují nedostupné PDF (HTTP 500). Obsahují ověřený tiskový náhled IC Office se všemi položkami. Otevřete je v prohlížeči a případně vytiskněte do PDF; nejsou originálním PDF z IC Office." : "Podklady jsou originální PDF z IC Office.",
		"Souhrnné doklady se podruhé nezapočítávají do položkové inventury skladu."
	].join("\r\n")), c.generateAsync({
		type: "blob",
		compression: "DEFLATE"
	});
}
// src/lib/odeslani.ts
var me = [
	{
		id: "pdf",
		nazev: "Balík sestav v PDF"
	},
	{
		id: "xlsx",
		nazev: "Balík sestav v Excelu"
	},
	{
		id: "skladoveDoklady",
		nazev: "Příjemky a výdejky (ZIP s doklady a souhrnem)"
	},
	{
		id: "pohoda",
		nazev: "POHODA XML"
	},
	{
		id: "money",
		nazev: "Money S3 XML"
	},
	{
		id: "isdoc",
		nazev: "Faktury ISDOC"
	},
	{
		id: "kh",
		nazev: "Kontrolní hlášení DPH (XML pro EPO)"
	}
];
function he(e) {
	let t = d(e.ucetniProgram);
	return me.filter((e) => ![
		"pohoda",
		"money",
		"isdoc"
	].includes(e.id) || e.id === t);
}
var W = "application/xml";
function ge(e, t) {
	let { data: n, n: r, o: i, sestavy: a } = t, o = _(n, i.od, i.do).length;
	switch (e) {
		case "skladoveDoklady": {
			if (!n.skladoveDoklady.some((e) => e.datum >= i.od && e.datum <= i.do)) return "V období nejsou načtené skladové doklady.";
			let e = H(n, t.skladovePdf ?? [], i);
			return e ? `Chybí ${e} podkladů skladových dokladů. Načtěte podklady z IC Office znovu.` : void 0;
		}
		case "pdf":
		case "xlsx": return a.some((e) => !e.chybiData) ? void 0 : "Žádná sestava zatím nemá data.";
		case "pohoda":
		case "money": return o || m(n, i.od, i.do).length ? void 0 : "V období nejsou žádné doklady.";
		case "isdoc": return o ? r.firma.ico ? void 0 : "Doplňte IČO firmy v Nastavení." : "V období nejsou žádné faktury.";
		case "kh": {
			let e = le(r);
			return e.length ? `V Nastavení chybí: ${e.map((e) => e.zprava).join(", ")}.` : void 0;
		}
	}
}
async function _e(e, t) {
	let { data: n, n: r, o: i } = t, a = p(i.od, i.do), o = t.sestavy.filter((e) => !e.chybiData);
	switch (e) {
		case "skladoveDoklady": return {
			nazev: `Prijemky_vydejky_${a}.zip`,
			obsah: await pe(n, t.skladovePdf ?? [], i),
			typ: "application/zip"
		};
		case "pdf": {
			let { sestavyDoPdf: e } = await import("./pdf-Di3NDlRj.js");
			return {
				nazev: `Sestavy_${a}.pdf`,
				obsah: await e(o, r.firma),
				typ: "application/pdf"
			};
		}
		case "xlsx": {
			let { sestavyDoExcelu: e } = await import("./excel-DZGwk7gJ.js");
			return {
				nazev: `Sestavy_${a}.xlsx`,
				obsah: await e(o, r.firma),
				typ: "application/octet-stream"
			};
		}
		case "pohoda": {
			let { pohodaXml: e } = await import("./pohoda-AkL8MAFY.js");
			return {
				nazev: `Pohoda_doklady_${a}.xml`,
				obsah: e(n, r, i.od, i.do),
				typ: W
			};
		}
		case "money": {
			let { moneyXml: e } = await import("./money-CgcHEsLP.js");
			return {
				nazev: `MoneyS3_doklady_${a}.xml`,
				obsah: e(n, r, i.od, i.do),
				typ: W
			};
		}
		case "isdoc": {
			let { isdocBalik: e } = await import("./isdoc-BqJVyXu3.js");
			return {
				...await e(n, r.firma, i.od, i.do),
				typ: "application/octet-stream"
			};
		}
		case "kh": return {
			nazev: `KH_DPH_${a}_${de(r.firma.nazev)}.xml`,
			obsah: ue(n, r, i.od, i.do),
			typ: W
		};
	}
}
function G(e) {
	return e.od === e.do ? t(e.od) : `${t(e.od)} – ${t(e.do)}`;
}
function K(e) {
	return e.split(/[\s,;]+/).filter(Boolean);
}
var q = (e) => /^[^\s@<>()[\],;:"\\]+@[^\s@<>()[\],;:"\\]+\.[^\s@<>()[\],;:"\\]{2,}$/.test(e), ve = 40;
function ye(e) {
	let t = y(e.data, e.n, e.o.od, e.o.do).length;
	return `Účetní podklady za ${G(e.o)}${t ? ` (k ověření: ${t})` : ""}${e.n.firma.nazev ? ` – ${e.n.firma.nazev}` : ""}`.slice(0, 200);
}
function be(e, t, n) {
	let r = [
		"Dobrý den,",
		"",
		`posílám podklady za období ${G(e.o)}${e.n.firma.nazev ? ` (${e.n.firma.nazev})` : ""}.`
	], i = y(e.data, e.n, e.o.od, e.o.do);
	if (i.length) {
		r.push("", `K OVĚŘENÍ: ${i.length} ${i.length === 1 ? "nesrovnalost" : i.length < 5 ? "nesrovnalosti" : "nesrovnalostí"} v dokladech z IC Office`);
		let e = i.slice(0, ve);
		for (let t of Object.keys(S)) {
			let n = e.filter((e) => e.oblast === t);
			if (n.length) {
				r.push(`${S[t]}:`);
				for (let e of n) r.push(`  - ${e.zprava}`);
			}
		}
		i.length > e.length && r.push(`  … a dalších ${i.length - e.length}, celý seznam je pod sestavami v příloze.`);
	}
	let a = new Set(i.map((e) => e.zprava));
	for (let t of e.sestavy) if (!t.chybiData && t.souhrny.length) {
		r.push("", `${t.nazev.toUpperCase()}${t.id === "pracovnici" ? ` (${t.obdobi})` : ""}`);
		for (let e of t.souhrny) if (e.polozky.length) {
			t.souhrny.length > 1 && e.nadpis && r.push(`${e.nadpis}:`);
			for (let t of e.polozky) {
				let e = x(t.hodnota, t.typ);
				r.push(`  ${t.nazev}: ${e}${t.typ === "kc" && e ? " Kč" : ""}`);
			}
		}
		for (let e of t.upozorneni) a.has(e) || r.push(`  Upozornění: ${e}`);
	}
	return r.push("", t.length ? `Přílohy: ${t.join(", ")}` : "Bez příloh."), n.length && r.push(`Nepřiloženo: ${n.join("; ")}`), r.push("", "Zpráva vznikla automaticky v Účetních sestavách (nastroje.mujautoservis.eu/sestavy) z exportů IC Office.", "Sestavy a soubory jsou podklad pro účetnictví a daňová podání, ne samotné podání: správnost před podáním ověřuje účetní."), r.join("\n");
}
// src/lib/automaticke-podklady.ts
function J(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e) || Object.getPrototypeOf(e) !== Object.prototype) throw Error("Neplatné nastavení automatického odesílání.");
	let n = e;
	if (t && Object.keys(n).some((e) => !t.includes(e))) throw Error("Nastavení automatického odesílání obsahuje neznámé pole.");
	return n;
}
function Y(e, t = 500) {
	if (typeof e != "string" || e.length > t || /[\u0000-\u001f\u007f]/.test(e)) throw Error("Neplatná textová hodnota nastavení.");
	return e.trim();
}
function X(e, t) {
	if (!t.includes(e)) throw Error("Neplatná volba nastavení.");
	return e;
}
function Z(e) {
	if (typeof e != "boolean") throw Error("Neplatná volba nastavení.");
	return e;
}
function Q(e) {
	if (typeof e != "number" || !Number.isFinite(e) || Math.abs(e) > 0xe8d4a51000) throw Error("Neplatná částka nastavení.");
	return e;
}
function $(e) {
	let t = J(e, Object.keys(f)), n = structuredClone(f), r = J(t.firma, Object.keys(n.firma));
	for (let e of Object.keys(n.firma)) n.firma[e] = Y(r[e]);
	if (!n.firma.nazev || !/^\d{8}$/.test(n.firma.ico) || !q(n.firma.email) || n.firma.email.length > 254) throw Error("Doplňte název, osmimístné IČO a platný e-mail firmy.");
	for (let e of [
		"predkontaceFaktur",
		"predkontacePokladny",
		"zkratkaPokladny",
		"cleniDph"
	]) n[e] = Y(t[e], 100);
	n.pocatecniZustatekPokladny = Q(t.pocatecniZustatekPokladny), n.datumTrzeb = X(t.datumTrzeb, ["duzp", "vystaveni"]), n.zahrnoutPokladnuDoTrzeb = Z(t.zahrnoutPokladnuDoTrzeb), n.vychoziObdobi = X(t.vychoziObdobi, ["den", "mesic"]), n.ucetniProgram = X(t.ucetniProgram, [
		"pohoda",
		"money",
		"jiny"
	]);
	let i = J(t.sklady), a = J(t.polozky);
	if (Object.keys(i).length > 1e3 || Object.keys(a).length > 2e4) throw Error("Nastavení obsahuje příliš mnoho skladů nebo položek.");
	for (let [e, t] of Object.entries(i)) {
		Y(e);
		let r = J(t, [
			"ucet",
			"pocatecniStav",
			"vyloucen"
		]);
		Object.defineProperty(n.sklady, e, {
			value: {
				ucet: Y(r.ucet, 100),
				pocatecniStav: Q(r.pocatecniStav),
				vyloucen: Z(r.vyloucen)
			},
			enumerable: !0
		});
	}
	for (let [e, t] of Object.entries(a)) Y(e, 1e3), Object.defineProperty(n.polozky, e, {
		value: X(t, ["material", "vykon"]),
		enumerable: !0
	});
	let o = J(t.odeslani, Object.keys(n.odeslani));
	n.odeslani.komu = Y(o.komu, 1500);
	let s = K(n.odeslani.komu);
	if (!s.length || s.length > 5 || !s.every((e) => e.length <= 254 && q(e))) throw Error("Zkontrolujte e-mailové adresy účetní (nejvýše pět).");
	if (n.odeslani.automaticky = Z(o.automaticky), n.odeslani.cas = Y(o.cas, 5), !/^([01]\d|2[0-3]):[0-5]\d$/.test(n.odeslani.cas)) throw Error("Neplatný čas odesílání.");
	n.odeslani.obdobi = X(o.obdobi, ["den", "mesic"]);
	let c = he(n).map((e) => e.id);
	if (!Array.isArray(o.prilohy) || !o.prilohy.length || o.prilohy.length > c.length || new Set(o.prilohy).size !== o.prilohy.length) throw Error("Zvolte přílohy automatického odesílání bez opakování.");
	return n.odeslani.prilohy = o.prilohy.map((e) => X(e, c)), n;
}
function xe(e) {
	if (typeof e != "string" || e.length > 14680064 || e.length % 4 != 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(e)) throw Error("Neplatný nebo příliš velký zdrojový soubor.");
	return Uint8Array.from(atob(e), (e) => e.charCodeAt(0));
}
function Se(e) {
	let t = "";
	for (let n = 0; n < e.length; n += 32768) t += String.fromCharCode(...e.subarray(n, n + 32768));
	return btoa(t);
}
function Ce(e) {
	J(e, ["od", "do"]);
	for (let t of [e.od, e.do]) if (typeof t != "string" || !/^\d{4}-\d{2}-\d{2}$/.test(t) || !Number.isFinite(Date.parse(t)) || new Date(t).toISOString().slice(0, 10) !== t) throw Error("Neplatné období účetních podkladů.");
	if (e.od > e.do) throw Error("Neplatné pořadí období účetních podkladů.");
}
async function we(e) {
	let t = $(e.nastaveni), n = e.obdobi;
	if (Ce(n), !Array.isArray(e.soubory) || e.soubory.length < 7 || e.soubory.length > 2007) throw Error("Chybí úplná sada sedmi exportů IC Office.");
	let r = [], i = [], a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set(), c = 0;
	for (let t of e.soubory) {
		J(t, ["nazev", "data"]);
		let e = Y(t.nazev, 240);
		if (!e || /[/\\]/.test(e) || a.has(e)) throw Error("Duplicitní nebo neplatný název zdrojového souboru.");
		a.add(e);
		let l = xe(t.data);
		if (c += l.length, c > 104857600) throw Error("Zdrojové soubory přesahují 100 MB.");
		if (/\.(pdf|html)$/i.test(e)) {
			let t = new File([l], e), n = R(t);
			if (!n || s.has(n)) throw Error("Neplatný nebo duplicitní podklad skladového dokladu.");
			s.add(n), i.push(t);
		} else {
			if (!/\.(csv|xlsx|xls)$/i.test(e)) throw Error("Neznámý druh zdrojového souboru.");
			let t = j(e, l.buffer);
			if (o.has(t.info.druh)) throw Error(`Duplicitní export: ${w[t.info.druh]}.`);
			if (o.add(t.info.druh), t.info.obdobi && (t.info.obdobi.od !== n.od || t.info.obdobi.do !== n.do)) throw Error(`Export „${e}“ patří do jiného období.`);
			let i = t.info.varovani.filter((e) => e !== "Export je prázdný, za toto období v IC Office nejsou žádné záznamy." && !/^\d+ řádků drobného jednicového materiálu mělo v exportu posunuté sloupce; načteny opravené\.$/.test(e));
			if (i.length) throw Error(`Export „${e}“ není úplný: ${i.join(" ")}`);
			r.push(t);
		}
	}
	let l = Object.keys(w).filter((e) => !o.has(e));
	if (l.length) throw Error(`Chybí exporty: ${l.map((e) => w[e]).join(", ")}.`);
	let u = ce(r);
	if (u.skladoveDoklady.some((e) => !e.id)) throw Error("Skladový doklad nemá ID pohybu; úplnost jeho podkladu nelze ověřit.");
	for (let e of i) {
		let t = u.skladoveDoklady.find((t) => t.id === R(e));
		if (!t || t.datum < n.od || t.datum > n.do) throw Error("Skladový podklad nepatří do exportu zvoleného období.");
		await z(e, t);
	}
	let d = {
		data: u,
		n: t,
		o: n,
		sestavy: b(u, t, n).map((e) => ({
			...e,
			chybiData: void 0
		})),
		skladovePdf: i
	}, f = [], p = 0;
	for (let e of t.odeslani.prilohy) {
		let t = ge(e, d), n = e === "skladoveDoklady" && u.skladoveDoklady.length === 0 || e === "isdoc" && u.faktury.length === 0 || ["pohoda", "money"].includes(e) && u.faktury.length === 0 && u.pokladna.length === 0;
		if (t && !n) throw Error(t);
		let r = await _e(e, d), i = typeof r.obsah == "string" ? new TextEncoder().encode(r.obsah) : r.obsah instanceof Blob ? new Uint8Array(await r.obsah.arrayBuffer()) : r.obsah;
		if (p += i.byteLength, !i.byteLength || p > 20971520) throw Error("Prázdná příloha nebo přílohy přesahující 20 MB; nic nebude odesláno.");
		let a = r.nazev.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.-]+/g, "_");
		if (a.length > 120 || f.some((e) => e.nazev === a)) throw Error("Neplatný nebo duplicitní název přílohy.");
		f.push({
			nazev: a,
			data: Se(i)
		});
	}
	let m = be(d, f.map((e) => e.nazev), []);
	if (m.length > 5e4) throw Error("Souhrn podkladů je příliš dlouhý; nic nebude odesláno.");
	return {
		komu: K(t.odeslani.komu),
		odpovedetNa: t.firma.email,
		predmet: ye(d),
		text: m,
		prilohy: f,
		summary: {
			souboru: r.length,
			skladovychDokladu: u.skladoveDoklady.length,
			priloh: f.length,
			bajtu: p
		}
	};
}
export { $ as overitAutomatickeNastaveni, we as pripravitAutomatickePodklady };
