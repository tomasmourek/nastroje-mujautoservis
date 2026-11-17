import { a as e, c as t, f as n, h as r, l as i, n as a, p as o } from "./zaklad-Xwu_hcf2.js";
import { i as s } from "./nastaveni-DdJkITgT.js";
import { a as c, c as l, d as u, f as d, i as f, l as p, n as m, o as h, r as g, s as _, t as v, u as y } from "./vypocty-cReu2eaY.js";
// src/lib/format.ts
var b = new Intl.NumberFormat("cs-CZ", {
	style: "percent",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
function x(n, r) {
	if (n == null || n === "") return "";
	if (typeof n == "string") return r === "datum" ? e(n) : n;
	switch (r) {
		case "kc": return t(n);
		case "procento": return b.format(n);
		case "hodiny": return t(n);
		default: return a(n);
	}
}
var S = (e) => e !== "text" && e !== "datum", C = {
	faktury: "Vydané faktury",
	pokladna: "Pokladna",
	sklad: "Sklad",
	dph: "DPH a kontrolní hlášení"
}, w = 27e4, T = 15, E = new Set("AT BE BG CY DE DK EE EL ES FI FR HR HU IE IT LT LU LV MT NL PL PT RO SE SI SK XI".split(" ")), D = (e) => `${t(e)} Kč`, O = (e, t) => Math.round((Date.parse(t) - Date.parse(e)) / 864e5);
function k(e, t) {
	let n = [], r = /* @__PURE__ */ new Map();
	for (let t of e) r.set(t, (r.get(t) ?? 0) + 1);
	let i = [...r].filter(([, e]) => e > 1).map(([e]) => e);
	i.length && n.push(`Číslo ${t} je použité vícekrát: ${i.join(", ")}.`);
	let a = /* @__PURE__ */ new Map();
	for (let e of r.keys()) {
		let t = /^(.*?)(\d+)$/.exec(e);
		if (!t) continue;
		let n = a.get(t[1]) ?? [];
		n.push({
			cislo: Number(t[2]),
			delka: t[2].length
		}), a.set(t[1], n);
	}
	let o = [];
	for (let [e, t] of a) {
		t.sort((e, t) => e.cislo - t.cislo);
		for (let n = 1; n < t.length; n++) {
			let r = t[n].cislo - t[n - 1].cislo;
			if (!(r < 2 || r > 20)) for (let r = t[n - 1].cislo + 1; r < t[n].cislo; r++) o.push(e + String(r).padStart(t[n].delka, "0"));
		}
	}
	return o.length && n.push(`V číselné řadě ${t} chybí ${o.slice(0, 10).join(", ")}${o.length > 10 ? ` a dalších ${o.length - 10}` : ""}. V exportu nejsou: ověřte v IC Office, zda jde o stornované doklady, nebo export není úplný.`), n;
}
function A(e) {
	let t = e.replace(/\s/g, "").toUpperCase();
	return !t || /^CZ\d{8,10}$/.test(t) ? null : /^\d{8,10}$/.test(t) ? `DIČ odběratele ${t} nemá kód státu CZ, proto se nepozná jako plátce a faktura nad 10 000 Kč by nešla do oddílu A.4 kontrolního hlášení.` : E.has(t.slice(0, 2)) && /^[A-Z]{2}[0-9A-Z+*]{2,12}$/.test(t) ? `Odběratel má zahraniční DIČ ${t}. Plnění do jiného státu EU nepatří do oddílů A.4 ani A.5 a sestava ho tam přesto počítá: ověřte s účetní režim DPH (dodání do EU, souhrnné hlášení).` : `DIČ odběratele „${e}“ nemá platný tvar.`;
}
function j(t, a, s) {
	let c = [], l = (e, t, n) => c.push({
		oblast: "faktury",
		doklad: e,
		zprava: t,
		zdroj: n
	});
	for (let { f: c, polozky: u, nesouhlasi: d } of p(t)) {
		if (!r(c.duzp, a, s) && !r(c.vystaveni, a, s)) continue;
		let t = c.zdroj;
		c.duzpChybi && l(c.cislo, `Faktura ${c.cislo} nemá v exportu DUZP; počítá se s datem vystavení ${e(c.vystaveni)}.`, t), d && l(c.cislo, `Položky faktury ${c.cislo} (${D(o(u, (e) => e.bez))} bez DPH) nesouhlasí s hlavičkou (${D(c.celkemBez)} bez DPH, ${D(c.celkemS)} s DPH).`, t);
		for (let e of u) {
			[
				0,
				12,
				21
			].includes(e.sazba) || l(c.cislo, `Faktura ${c.cislo}, položka „${e.nazev}“: sazba ${e.sazba} % neplatí od 1. 1. 2024. Jde-li o opravu staršího plnění, je v pořádku, jinak opravte sazbu.`, e.zdroj);
			let t = n(e.bez * e.sazba / 100);
			Math.abs(e.dph - t) > .011 && l(c.cislo, `Faktura ${c.cislo}, položka „${e.nazev}“: DPH ${D(e.dph)}, ale ze základu ${D(e.bez)} při ${e.sazba} % vychází ${D(t)}.`, e.zdroj);
		}
		c.castkaS && Math.abs(n(c.celkemS + c.zaokrouhleni) - c.castkaS) > .01 && l(c.cislo, `Faktura ${c.cislo}: částka k úhradě ${D(c.castkaS)} nesouhlasí s celkem ${D(c.celkemS)} a zaokrouhlením ${D(c.zaokrouhleni)}. Porovnejte s vystavenou fakturou, zda je správně DPH i režim (např. přenesení daňové povinnosti).`, t), Math.abs(c.zaokrouhleni) > .5 && l(c.cislo, `Faktura ${c.cislo}: zaokrouhlení ${D(c.zaokrouhleni)} je víc než 50 haléřů.`, t), i(c.forma).startsWith("hotov") && Math.abs(c.castkaS) > 27e4 && l(c.cislo, `Faktura ${c.cislo} za ${D(c.castkaS)} je placená hotově nad zákonný limit ${D(w)} (zákon o omezení plateb v hotovosti).`, t), c.duzp && c.vystaveni && O(c.duzp, c.vystaveni) > T && l(c.cislo, `Faktura ${c.cislo} je vystavená ${O(c.duzp, c.vystaveni)} dní po DUZP; daňový doklad se má vystavit do 15 dnů (§ 28 odst. 8 ZDPH).`, t), c.splatnost && c.vystaveni && c.splatnost < c.vystaveni && l(c.cislo, `Faktura ${c.cislo} má splatnost ${e(c.splatnost)} před datem vystavení.`, t);
		let f = A(c.dic);
		f && l(c.cislo, `Faktura ${c.cislo}: ${f}`, t);
	}
	let u = t.faktury.filter((e) => r(e.vystaveni, a, s)).map((e) => e.cislo);
	for (let e of k(u, "faktur")) l("", e);
	return c;
}
function M(t, a, s, c) {
	let l = [], u = (e, t, n) => l.push({
		oblast: "pokladna",
		doklad: e,
		zprava: t,
		zdroj: n
	}), d = t.pokladna.filter((e) => r(e.datum, s, c));
	for (let e of d) {
		let t = e.prijem || e.vydej, r = o([
			0,
			12,
			21
		], (t) => e.sazby[t].celkem);
		r && Math.abs(t - r) > .01 && u(e.cislo, `Pokladní doklad ${e.cislo}: částka ${D(t)} nesouhlasí se součtem podle sazeb DPH ${D(r)}.`, e.zdroj);
		for (let t of [21, 12]) {
			let r = n(e.sazby[t].zaklad * t / 100);
			Math.abs(e.sazby[t].dph - r) > .011 && u(e.cislo, `Pokladní doklad ${e.cislo}: DPH ${t} % je ${D(e.sazby[t].dph)}, ze základu ${D(e.sazby[t].zaklad)} vychází ${D(r)}.`, e.zdroj);
		}
		Math.abs(e.sazby[0].zaklad) > .5 && u(e.cislo, `Pokladní doklad ${e.cislo} má ${D(e.sazby[0].zaklad)} bez DPH. Pokud nejde o osvobozené plnění, ověřte sazbu.`, e.zdroj), e.prijem && e.vydej && u(e.cislo, `Pokladní doklad ${e.cislo} má vyplněný příjem i výdej.`, e.zdroj), Math.abs(t) > 27e4 && u(e.cislo, `Pokladní doklad ${e.cislo} na ${D(t)} je nad limitem plateb v hotovosti ${D(w)}.`, e.zdroj);
	}
	for (let e of k(d.map((e) => e.cislo), "pokladních dokladů")) u("", e);
	if (t.pokladna.length) {
		let n = h(t, a, s, c).radky.find((e) => e.zustatek < 0);
		n && u(n.d.cislo, `Zůstatek pokladny je po dokladu ${n.d.cislo} (${e(n.d.datum)}) záporný: ${D(n.zustatek)}. Pokladna nemůže vydat víc, než má; chybí příjem nebo počáteční stav.`, n.d.zdroj);
		let l = new Set(t.pokladna.map((e) => e.faktura).filter(Boolean)), d = t.faktury.filter((e) => i(e.forma).startsWith("hotov") && r(e.zaplaceno || e.vystaveni, s, c) && !l.has(e.cislo));
		d.length && u("", `${d.length} faktur placených hotově (${D(o(d, (e) => e.castkaS))}) nemá příjem v exportu Pokladna: ${d.map((e) => e.cislo).join(", ")}. Zůstatek pokladní knihy je o tyto příjmy nižší než skutečná hotovost.`);
	}
	return l;
}
function N(t, i, a, c) {
	let l = [], u = t.pohyby.filter((e) => r(e.datum, a, c) && !s(i, e.sklad || "Bez skladu").vyloucen);
	for (let t of u) {
		let r = `${t.smer === "prijem" ? "Příjemka" : "Výdejka"} ${[t.doklad, t.kod].filter(Boolean).join(", ")} (${e(t.datum)})`;
		Math.abs(n(t.mnozstvi * t.cenaMjBez) - t.bez) > Math.abs(t.mnozstvi) * .005 + .02 && l.push({
			oblast: "sklad",
			doklad: t.doklad,
			zprava: `${r}: ${t.mnozstvi} × ${D(t.cenaMjBez)} nedává celkem ${D(t.bez)}.`,
			zdroj: t.zdroj
		}), t.sklad || l.push({
			oblast: "sklad",
			doklad: t.doklad,
			zprava: `${r} nemá uvedený sklad; počítá se do „Bez skladu“.`,
			zdroj: t.zdroj
		});
	}
	let d = u.filter((e) => e.smer === "vydej" && /dobropis/i.test(e.poznamka + " " + e.druh));
	return d.length && l.push({
		oblast: "sklad",
		doklad: "",
		zprava: `${d.length} výdejů s poznámkou „dobropis“ (${D(o(d, (e) => Math.abs(e.bez)))}) se odečítá ze skladu jako vratka dodavateli. Pokud jde o zboží vrácené zákazníkem, má se naopak přičíst: ověřte v IC Office.`
	}), l;
}
function P(e, t, n, r) {
	return [
		...j(e, n, r),
		...c(e, n, r).upozorneni.map((e) => ({
			oblast: "dph",
			doklad: "",
			zprava: e
		})),
		...M(e, t, n, r),
		...N(e, t, n, r)
	];
}
// src/lib/sestavy.ts
var F = 3;
function I(e) {
	return `Kontrola dokladů: ${e} ${e === 1 ? "nález" : e >= 2 && e <= 4 ? "nálezy" : "nálezů"}`;
}
function L(e) {
	let t = e.filter((e) => !e.zdroj).map((e) => e.zprava), n = e.filter((e) => e.zdroj).map((e) => e.zprava);
	return n.length > F ? {
		upozorneni: t,
		nalezy: n
	} : { upozorneni: [...t, ...n] };
}
var R = (t) => `${e(t.od)} – ${e(t.do)}`, z = (e, t, n = 1.1) => ({
	klic: e,
	nazev: t,
	typ: "kc",
	sirka: n
});
function B(e, t = "Rozpis DPH podle sazeb") {
	let n = [];
	for (let t of v) (e[t].zaklad || e[t].dph) && (n.push({
		nazev: `Základ ${t} %`,
		hodnota: e[t].zaklad,
		typ: "kc"
	}), t && n.push({
		nazev: `DPH ${t} %`,
		hodnota: e[t].dph,
		typ: "kc"
	}));
	return n.length || n.push({
		nazev: "Bez plnění",
		hodnota: 0,
		typ: "kc"
	}), {
		nadpis: t,
		polozky: n
	};
}
function V(e, t, r) {
	let i = u(e, t, r.od, r.do), a = [
		{
			klic: "datum",
			nazev: t.datumTrzeb === "duzp" ? "DUZP" : "Datum vystavení",
			typ: "datum",
			sirka: .9
		},
		{
			klic: "zakazka",
			nazev: "Zakázka",
			typ: "text",
			sirka: .9
		},
		{
			klic: "doklad",
			nazev: "Doklad",
			typ: "text",
			sirka: .9
		},
		{
			klic: "odberatel",
			nazev: "Odběratel",
			typ: "text",
			sirka: 1.8
		},
		z("materialNaklady", "Materiál náklady"),
		z("materialPc", "Materiál PC"),
		z("vykony", "Výkony"),
		z("djm", "DJM", .8),
		z("dph", "DPH"),
		z("placeno", "Placeno"),
		{
			klic: "forma",
			nazev: "Forma",
			typ: "text",
			sirka: .45
		},
		{
			klic: "pocet",
			nazev: "Počet",
			typ: "cislo",
			sirka: .45
		}
	], s = [
		"materialNaklady",
		"materialPc",
		"vykony",
		"djm",
		"dph",
		"placeno"
	], c = [], l = [...new Set(i.map((e) => e.datum))];
	for (let e of l) {
		let t = i.filter((t) => t.datum === e);
		for (let e of t) {
			let t = [e.bezSkladoveCeny ? `${e.bezSkladoveCeny}× materiál bez skladové ceny` : "", e.nesouhlasi ? "položky nesouhlasí s hlavičkou faktury" : ""].filter(Boolean).join("; ");
			c.push({
				h: {
					datum: e.datum,
					zakazka: e.zakazka,
					doklad: e.doklad,
					odberatel: e.odberatel,
					materialNaklady: e.materialNaklady,
					materialPc: e.materialPc,
					vykony: e.vykony,
					djm: e.djm,
					dph: e.dph,
					placeno: e.placeno,
					forma: e.forma,
					pocet: null
				},
				upozorneni: t || void 0,
				zdroje: e.zdroje
			});
		}
		let n = {
			datum: e,
			odberatel: "Za datum",
			forma: "",
			pocet: t.length
		};
		for (let e of s) n[e] = o(t, (t) => t[e]);
		c.push({
			h: n,
			druh: "mezisoucet"
		});
	}
	let d = Object.fromEntries(s.map((e) => [e, o(i, (t) => t[e])]));
	c.push({
		h: {
			...d,
			odberatel: "Celkem",
			pocet: i.length
		},
		druh: "soucet"
	});
	let f = /* @__PURE__ */ new Map();
	for (let e of i) f.set(e.forma || "?", n((f.get(e.forma || "?") ?? 0) + e.placeno));
	let p = {
		H: "Hotově (H)",
		K: "Kartou (K)",
		F: "Převodem (F)",
		D: "Dobírkou (D)",
		Z: "Zálohou (Z)"
	}, m = o(i, (e) => e.bezSkladoveCeny), h = [];
	m && h.push(`${m}× materiál bez skladové ceny (kód není v načtených pohybech skladu). Náklady i marže jsou proto nižší, než ve skutečnosti. Načtěte naskladnění a výdeje za delší období.`);
	let g = i.filter((e) => e.nesouhlasi).map((e) => e.doklad);
	g.length && h.push(`Položky nesouhlasí s hlavičkou u faktur: ${g.join(", ")}.`), !e.polozky.length && e.faktury.length && h.push("Není načten export položek faktur, materiál a výkony proto nejde oddělit (vše je ve výkonech).");
	let _ = U(e, r);
	return h.push(..._.upozorneni), {
		id: "trzby",
		kod: "sest_trz",
		nazev: "Tržby, DPH",
		obdobi: R(r),
		popis: `Podle ${t.datumTrzeb === "duzp" ? "data uskutečnění zdanitelného plnění" : "data vystavení"}${t.zahrnoutPokladnuDoTrzeb ? ", včetně samostatných prodejů z pokladny" : ""}.`,
		orientace: "landscape",
		tabulky: [{
			sloupce: a,
			radky: c
		}, ..._.tabulky],
		souhrny: [
			{
				nadpis: "Souhrn",
				polozky: [
					{
						nazev: "Počet dokladů",
						hodnota: i.length,
						typ: "cislo"
					},
					{
						nazev: "Materiál – skladové ceny",
						hodnota: d.materialNaklady,
						typ: "kc"
					},
					{
						nazev: "Materiál – prodejní ceny",
						hodnota: d.materialPc,
						typ: "kc"
					},
					{
						nazev: "Marže materiálu",
						hodnota: n(d.materialPc - d.materialNaklady),
						typ: "kc",
						zvyraznit: !0
					},
					{
						nazev: "Výkony",
						hodnota: d.vykony,
						typ: "kc"
					},
					{
						nazev: "DJM",
						hodnota: d.djm,
						typ: "kc"
					},
					{
						nazev: "DPH",
						hodnota: d.dph,
						typ: "kc"
					},
					{
						nazev: "Placeno",
						hodnota: d.placeno,
						typ: "kc",
						zvyraznit: !0
					}
				]
			},
			{
				nadpis: "Podle formy úhrady",
				polozky: [...f].map(([e, t]) => ({
					nazev: p[e] ?? e,
					hodnota: t,
					typ: "kc"
				}))
			},
			B(y(i.map((e) => e.rozpis))),
			..._.souhrny
		],
		upozorneni: h,
		chybiData: e.faktury.length || e.pokladna.length ? void 0 : "Načtěte export Vystavené faktury (a ideálně i jejich položky a pokladnu)."
	};
}
var H = "2026-10-01";
function U(r, i) {
	if (i.do < "2027-01-01") return {
		tabulky: [],
		souhrny: [],
		upozorneni: i.do >= H ? ["Od 1. 1. 2027 platí zákon č. 180/2026 Sb. o evidenci tržeb (EET 2.0): platby v hotovosti a kartou přijaté v provozovně se evidují online nejpozději při přijetí. Účtenka se už povinně nevydává. Předem je potřeba v daňové informační schránce oznámit provozovny a získat certifikát. Sestavy za období od ledna 2027 ukážou denní součty těchto plateb k porovnání s evidencí."] : []
	};
	let a = i.od < "2027-01-01" ? m : i.od, { dny: s, nezaplacene: c } = f(r, a, i.do), l = o(s, (e) => e.hotove), u = o(s, (e) => e.kartou), d = [`Platby v hotovosti a kartou (${t(n(l + u))} Kč${a > i.od ? ` od ${e(a)}` : ""}) mají po dnech odpovídat tržbám zaevidovaným v evidenci tržeb (pokladní systém nebo aplikace Finanční správy). Platby převodem a dobírka vyplacená poštou na účet se neevidují. Úhrady faktur hotově a kartou jsou zahrnuté, protože zákon váže evidenci na platbu, ne na doklad; IC Office v exportu neuvádí, zda byla platba zaevidována.`];
	return c.length && d.push(`Faktury s formou hotově nebo kartou, které jsou podle exportu nezaplacené, v denních součtech nejsou: ${c.join(", ")}. Platba se eviduje, až když ji přijmete.`), {
		tabulky: [{
			nadpis: "Platby v hotovosti a kartou po dnech (evidence tržeb)",
			sloupce: [
				{
					klic: "datum",
					nazev: "Den přijetí",
					typ: "datum",
					sirka: .9
				},
				z("hotove", "Hotově"),
				z("kartou", "Kartou"),
				z("celkem", "Celkem"),
				{
					klic: "pocet",
					nazev: "Počet plateb",
					typ: "cislo",
					sirka: .6
				}
			],
			radky: [...s.map((e) => ({
				h: {
					datum: e.datum,
					hotove: e.hotove,
					kartou: e.kartou,
					celkem: n(e.hotove + e.kartou),
					pocet: e.pocet
				},
				zdroje: e.zdroje
			})), {
				h: {
					datum: "Celkem",
					hotove: l,
					kartou: u,
					celkem: n(l + u),
					pocet: o(s, (e) => e.pocet)
				},
				druh: "soucet"
			}]
		}],
		souhrny: [{
			nadpis: "Evidence tržeb (EET 2.0)",
			polozky: [
				{
					nazev: "Hotově",
					hodnota: l,
					typ: "kc"
				},
				{
					nazev: "Kartou",
					hodnota: u,
					typ: "kc"
				},
				{
					nazev: "K porovnání s evidencí",
					hodnota: n(l + u),
					typ: "kc",
					zvyraznit: !0
				}
			]
		}],
		upozorneni: d
	};
}
var W = {
	predchoziInventura: "Z předešlé inventury",
	pocatek: "Vypočtený počáteční zůstatek",
	prijem: "Příjem na sklad",
	prevodNa: "Převod na sklad",
	prevodZe: "Převod ze skladu",
	dobropisy: "Dobropisy",
	manka: "Manka, přebytky",
	vydej: "Výdej ze skladu",
	storno: "Storno výdeje",
	prodej: "Prodej pokladnou",
	neucetni: "Neúčetní zásahy",
	konec: "Konečný zůstatek"
};
function G(t, i, a) {
	let c = g(t, i, a.od, a.do), l = Object.keys(W), u = [
		{
			klic: "ucet",
			nazev: "Účet",
			typ: "text",
			sirka: .6
		},
		{
			klic: "sklad",
			nazev: "Popis",
			typ: "text",
			sirka: 1.5
		},
		...l.map((e) => z(e, W[e], .95))
	], d = [], f = [...new Set(c.map((e) => e.ucet))], p = (e) => Object.fromEntries(l.map((t) => [t, o(e, (e) => e.hodnoty[t])]));
	for (let e of f) {
		let t = c.filter((t) => t.ucet === e);
		for (let e of t) d.push({
			h: {
				ucet: e.ucet || "???",
				sklad: e.sklad,
				...e.hodnoty
			},
			zdroje: e.zdroje
		});
		d.push({
			h: {
				ucet: "",
				sklad: e ? `Součet účtu ${e}` : "Součet nepřiřazených",
				...p(t)
			},
			druh: "mezisoucet"
		});
	}
	let m = p(c);
	d.push({
		h: {
			ucet: "",
			sklad: "Součet celkem",
			...m
		},
		druh: "soucet"
	});
	let h = [...new Set(t.pohyby.map((e) => e.sklad || "Bez skladu"))].filter((e) => s(i, e).vyloucen), v = [], y = c.filter((e) => !e.ucet).map((e) => e.sklad);
	y.length && v.push(`Sklady bez přiřazeného účtu: ${y.join(", ")}. Účet nastavíte v Nastavení › Sklady.`);
	let b = c.length > 0 && c.every((e) => !s(i, e.sklad).pocatecniStav);
	b && v.push("Počáteční stavy skladů nejsou zadané. Zůstatek je proto rozdíl příjmů a výdajů z načtených exportů, ne skutečná hodnota skladu; záporná částka znamená, že se vydalo zboží z dřívější zásoby. Hodnotu z poslední inventury doplníte v Nastavení › Sklady."), h.length && v.push(`Nezapočtené sklady: ${h.join(", ")}.`);
	let x = L(N(t, i, a.od, a.do));
	v.push(...x.upozorneni);
	let S = n(m.prijem + m.prevodNa + m.storno + Math.max(0, m.manka)), C = n(m.vydej + m.prodej + m.prevodZe + m.dobropisy + Math.max(0, -m.manka)), w = _(t, i, a.do), T = w.filter((e) => e.zustatek > 0), E = w.filter((e) => e.zustatek < 0).length, D = o(T, (e) => e.hodnota), O = T.map((e) => ({
		h: {
			sklad: e.sklad,
			kod: e.kod,
			popis: e.popis,
			prijato: e.prijato,
			vydano: e.vydano,
			zustatek: e.zustatek,
			hodnota: e.hodnota
		},
		zdroje: e.zdroje
	}));
	T.length && O.push({
		h: {
			popis: `Celkem ${T.length} položek`,
			hodnota: D
		},
		druh: "soucet"
	});
	let k = t.skladoveDoklady.length > 0 || t.soubory.some((e) => e.druh === "skladoveDoklady"), A = k ? ["prijem", "vydej"].map((e) => {
		let n = t.skladoveDoklady.filter((t) => t.smer === e && r(t.datum, a.od, a.do)).sort((e, t) => e.datum.localeCompare(t.datum) || e.cislo.localeCompare(t.cislo, "cs"));
		return {
			nadpis: e === "prijem" ? "Příjemky" : "Výdejky",
			sloupce: [
				{
					klic: "datum",
					nazev: "Datum",
					typ: "datum",
					sirka: .8
				},
				{
					klic: "cislo",
					nazev: "Číslo dokladu",
					typ: "text",
					sirka: .8
				},
				{
					klic: "partner",
					nazev: "Partner",
					typ: "text",
					sirka: 1.4
				},
				{
					klic: "nazev",
					nazev: "Název",
					typ: "text",
					sirka: 1.6
				},
				{
					klic: "zakazka",
					nazev: "Zakázka",
					typ: "text",
					sirka: .8
				},
				{
					klic: "faktura",
					nazev: "Faktura",
					typ: "text",
					sirka: .8
				},
				z("bez", "Bez DPH", .9),
				z("s", "S DPH", .9)
			],
			radky: [...n.map((e) => ({
				h: {
					datum: e.datum,
					cislo: e.cislo,
					partner: e.partner,
					nazev: e.nazev,
					zakazka: e.zakazka,
					faktura: e.faktura,
					bez: e.bez,
					s: e.s
				},
				zdroje: [e.zdroj]
			})), {
				h: {
					nazev: "Součet celkem",
					bez: o(n, (e) => e.bez),
					s: o(n, (e) => e.s)
				},
				druh: "soucet"
			}]
		};
	}) : [];
	return k && !t.pohyby.length && v.push("Příjemky a výdejky jsou souhrnné doklady. Pro výpočet hodnoty skladu a zůstalých položek načtěte také exporty Naskladněné zboží a Vydané zboží."), {
		id: "inventura",
		kod: "sest_uza",
		nazev: "Inventura účtů ve skladových cenách",
		obdobi: R(a),
		popis: "Hodnoty skladů podle pohybů v cenách bez DPH, seskupené podle účtů.",
		orientace: "landscape",
		tabulky: [
			{
				nadpis: "Hodnota skladů podle účtů",
				sloupce: u,
				radky: d
			},
			{
				nadpis: `Položky, které zůstaly skladem k ${e(a.do)} (přijato minus vydáno)`,
				sloupce: [
					{
						klic: "sklad",
						nazev: "Sklad",
						typ: "text",
						sirka: 1
					},
					{
						klic: "kod",
						nazev: "Kód",
						typ: "text",
						sirka: 1
					},
					{
						klic: "popis",
						nazev: "Název",
						typ: "text",
						sirka: 2.4
					},
					{
						klic: "prijato",
						nazev: "Přijato",
						typ: "cislo",
						sirka: .7
					},
					{
						klic: "vydano",
						nazev: "Vydáno",
						typ: "cislo",
						sirka: .7
					},
					{
						klic: "zustatek",
						nazev: "Zůstalo",
						typ: "cislo",
						sirka: .7
					},
					z("hodnota", "Hodnota bez DPH", 1)
				],
				radky: O
			},
			...A
		],
		souhrny: [{ polozky: [
			{
				nazev: b ? "Počáteční stav (nezadaný)" : "Počáteční stav",
				hodnota: m.pocatek,
				typ: "kc"
			},
			{
				nazev: "Celkový příjem na sklad",
				hodnota: S,
				typ: "kc"
			},
			{
				nazev: "Celkový výdej ze skladu",
				hodnota: C,
				typ: "kc"
			},
			{
				nazev: b ? "Rozdíl příjmů a výdajů" : "Zůstatek",
				hodnota: m.konec,
				typ: "kc",
				zvyraznit: !0
			}
		] }, {
			nadpis: "Položky",
			polozky: [
				{
					nazev: "Zůstalo skladem (položek)",
					hodnota: T.length,
					typ: "cislo"
				},
				{
					nazev: "Hodnota zůstalých položek",
					hodnota: D,
					typ: "kc"
				},
				{
					nazev: "Vydáno víc, než přijato (položek z dřívější zásoby)",
					hodnota: E,
					typ: "cislo"
				}
			]
		}],
		upozorneni: v,
		nalezy: x.nalezy,
		chybiData: t.pohyby.length || k ? void 0 : "Načtěte exporty Naskladněné zboží a Vydané zboží."
	};
}
function K(e, t) {
	let r = l(e), i = o(r, (e) => e.prace), a = o(r, (e) => e.celkem), s = [
		{
			klic: "mechanik",
			nazev: "Pracovník",
			typ: "text",
			sirka: 1.6
		},
		{
			klic: "zakazky",
			nazev: "Počet zakázek",
			typ: "cislo",
			sirka: .7
		},
		{
			klic: "podilPrace",
			nazev: "Podíl z výkonu",
			typ: "procento",
			sirka: .7
		},
		{
			klic: "cas",
			nazev: "Účtovaný čas (h)",
			typ: "hodiny",
			sirka: .8
		},
		z("prace", "Výkon pracovníka"),
		z("material", "Materiál"),
		z("ostatni", "Ostatní"),
		z("celkem", "Výkon servisu"),
		{
			klic: "podilVykonu",
			nazev: "Podíl na výkonu",
			typ: "procento",
			sirka: .7
		},
		z("naHodinu", "Práce za hodinu", .9)
	], c = r.map((e) => ({
		h: {
			mechanik: e.mechanik,
			zakazky: e.zakazky,
			podilPrace: i ? e.prace / i : 0,
			cas: e.cas,
			prace: e.prace,
			material: e.material,
			ostatni: e.ostatni,
			celkem: e.celkem,
			podilVykonu: a ? e.celkem / a : 0,
			naHodinu: e.cas ? n(e.prace / e.cas) : null
		},
		zdroje: e.zdroje
	})), u = o(r, (e) => e.cas);
	return c.push({
		h: {
			mechanik: "Celkem",
			zakazky: o(r, (e) => e.zakazky),
			podilPrace: +!!r.length,
			cas: u,
			prace: i,
			material: o(r, (e) => e.material),
			ostatni: o(r, (e) => e.ostatni),
			celkem: a,
			podilVykonu: +!!r.length,
			naHodinu: u ? n(i / u) : null
		},
		druh: "soucet"
	}), {
		id: "pracovnici",
		kod: "sest_prac",
		nazev: "Všichni pracovníci",
		obdobi: t,
		popis: "Výkon mechaniků podle exportu Mechanici – zakázky. Export neobsahuje data zakázek, období odpovídá exportu. Jedna zakázka může být u více mechaniků.",
		orientace: "landscape",
		tabulky: [{
			sloupce: s,
			radky: c
		}],
		souhrny: [],
		upozorneni: [],
		chybiData: e.mechanici.length ? void 0 : "Načtěte export Mechanici – zakázky."
	};
}
function q(e, t, n) {
	let r = h(e, t, n.od, n.do), i = [
		{
			klic: "datum",
			nazev: "Datum",
			typ: "datum",
			sirka: .8
		},
		{
			klic: "cislo",
			nazev: "Doklad",
			typ: "text",
			sirka: .8
		},
		{
			klic: "popis",
			nazev: "Popis",
			typ: "text",
			sirka: 2
		},
		{
			klic: "faktura",
			nazev: "Faktura",
			typ: "text",
			sirka: .8
		},
		z("zaklad21", "Základ 21 %", .9),
		z("dph21", "DPH 21 %", .8),
		z("zaklad12", "Základ 12 %", .9),
		z("dph12", "DPH 12 %", .8),
		z("zaklad0", "Osvobozeno", .8),
		z("prijem", "Příjem", .9),
		z("vydej", "Výdej", .9),
		z("zustatek", "Zůstatek", 1)
	], a = [
		{
			h: {
				popis: "Počáteční zůstatek",
				zustatek: r.pocatek
			},
			druh: "mezisoucet"
		},
		...r.radky.map(({ d: e, zustatek: t }) => ({
			h: {
				datum: e.datum,
				cislo: e.cislo,
				popis: e.popis,
				faktura: e.faktura,
				zaklad21: e.sazby[21].zaklad,
				dph21: e.sazby[21].dph,
				zaklad12: e.sazby[12].zaklad,
				dph12: e.sazby[12].dph,
				zaklad0: e.sazby[0].zaklad,
				prijem: e.prijem,
				vydej: e.vydej,
				zustatek: t
			},
			zdroje: [e.zdroj]
		})),
		{
			h: {
				popis: "Celkem / konečný zůstatek",
				zaklad21: o(r.radky, (e) => e.d.sazby[21].zaklad),
				dph21: o(r.radky, (e) => e.d.sazby[21].dph),
				zaklad12: o(r.radky, (e) => e.d.sazby[12].zaklad),
				dph12: o(r.radky, (e) => e.d.sazby[12].dph),
				zaklad0: o(r.radky, (e) => e.d.sazby[0].zaklad),
				prijem: r.prijmy,
				vydej: r.vydaje,
				zustatek: r.konec
			},
			druh: "soucet"
		}
	], s = [];
	t.pocatecniZustatekPokladny || s.push("Počáteční zůstatek pokladny není zadaný (počítá se od 0). Doplníte ho v Nastavení › Pokladna.");
	let c = L(M(e, t, n.od, n.do));
	return s.push(...c.upozorneni), {
		id: "pokladna",
		kod: "sest_pok",
		nazev: "Pokladní kniha",
		obdobi: R(n),
		popis: "Doklady s vyplněnou fakturou jsou úhrady faktur; samostatné doklady jsou prodeje za hotové.",
		orientace: "landscape",
		tabulky: [{
			sloupce: i,
			radky: a
		}],
		souhrny: [{ polozky: [
			{
				nazev: "Počáteční zůstatek",
				hodnota: r.pocatek,
				typ: "kc"
			},
			{
				nazev: "Příjmy",
				hodnota: r.prijmy,
				typ: "kc"
			},
			{
				nazev: "Výdaje",
				hodnota: r.vydaje,
				typ: "kc"
			},
			{
				nazev: "Konečný zůstatek",
				hodnota: r.konec,
				typ: "kc",
				zvyraznit: !0
			}
		] }, B(r.rozpis)],
		upozorneni: s,
		nalezy: c.nalezy,
		chybiData: e.pokladna.length ? void 0 : "Načtěte export Pokladna."
	};
}
function J(t, n) {
	let a = p(t).filter((e) => r(e.f.duzp, n.od, n.do));
	a.sort((e, t) => e.f.cislo.localeCompare(t.f.cislo, "cs", { numeric: !0 }));
	let s = [
		{
			klic: "cislo",
			nazev: "Číslo",
			typ: "text",
			sirka: .8
		},
		{
			klic: "vystaveni",
			nazev: "Vystaveno",
			typ: "datum",
			sirka: .75
		},
		{
			klic: "duzp",
			nazev: "DUZP",
			typ: "datum",
			sirka: .75
		},
		{
			klic: "splatnost",
			nazev: "Splatnost",
			typ: "datum",
			sirka: .75
		},
		{
			klic: "zakaznik",
			nazev: "Odběratel",
			typ: "text",
			sirka: 1.8
		},
		{
			klic: "dic",
			nazev: "IČO / DIČ",
			typ: "text",
			sirka: 1
		},
		{
			klic: "forma",
			nazev: "Úhr.",
			typ: "text",
			sirka: .4
		},
		z("zaklad21", "Základ 21 %", .9),
		z("dph21", "DPH 21 %", .8),
		z("zaklad12", "Základ 12 %", .8),
		z("dph12", "DPH 12 %", .7),
		z("zaklad0", "Osvob.", .7),
		z("celkem", "Celkem s DPH", 1),
		{
			klic: "stav",
			nazev: "Stav",
			typ: "text",
			sirka: .8
		}
	], c = j(t, n.od, n.do), l = L(c), u = new Set(c.map((e) => e.doklad)), f = a.map(({ f: t, rozpis: n, bezPolozek: r, nesouhlasi: i }) => ({
		h: {
			cislo: t.cislo,
			vystaveni: t.vystaveni,
			duzp: t.duzp,
			splatnost: t.splatnost,
			zakaznik: t.zakaznik,
			dic: [t.ico, t.dic].filter(Boolean).join(" / "),
			forma: d(t.forma),
			zaklad21: n[21].zaklad,
			dph21: n[21].dph,
			zaklad12: n[12].zaklad,
			dph12: n[12].dph,
			zaklad0: n[0].zaklad,
			celkem: t.castkaS,
			stav: t.zaplaceno ? `uhrazeno ${e(t.zaplaceno)}` : t.stav
		},
		upozorneni: i ? "položky nesouhlasí s hlavičkou" : r ? "bez položek – sazba odvozena z hlavičky" : u.has(t.cislo) ? "nesrovnalost, viz upozornění u sestavy" : void 0,
		zdroje: [t.zdroj]
	})), m = (e) => o(f, (t) => t.druh ? 0 : Number(t.h[e] ?? 0));
	f.push({
		h: {
			zakaznik: `Celkem ${a.length} faktur`,
			zaklad21: m("zaklad21"),
			dph21: m("dph21"),
			zaklad12: m("zaklad12"),
			dph12: m("dph12"),
			zaklad0: m("zaklad0"),
			celkem: m("celkem")
		},
		druh: "soucet"
	});
	let h = a.filter((e) => i(e.f.stav).startsWith("nezaplac"));
	return {
		id: "faktury",
		kod: "sest_fv",
		nazev: "Kniha vydaných faktur",
		obdobi: R(n),
		popis: "Faktury podle data uskutečnění zdanitelného plnění, rozpis DPH z položek faktur.",
		orientace: "landscape",
		tabulky: [{
			sloupce: s,
			radky: f
		}],
		souhrny: [{ polozky: [
			{
				nazev: "Počet faktur",
				hodnota: a.length,
				typ: "cislo"
			},
			{
				nazev: "Celkem s DPH",
				hodnota: m("celkem"),
				typ: "kc",
				zvyraznit: !0
			},
			{
				nazev: "Nezaplaceno (počet)",
				hodnota: h.length,
				typ: "cislo"
			},
			{
				nazev: "Nezaplaceno (částka)",
				hodnota: o(h, (e) => e.f.castkaS),
				typ: "kc"
			}
		] }, B(y(a.map((e) => e.rozpis)))],
		upozorneni: l.upozorneni,
		nalezy: l.nalezy,
		chybiData: t.faktury.length ? void 0 : "Načtěte export Vystavené faktury."
	};
}
function Y(e, t) {
	let r = c(e, t.od, t.do), i = [
		{ h: {
			radek: "1",
			popis: "Dodání zboží / poskytnutí služeb – základní sazba 21 %",
			zaklad: r.celkem[21].zaklad,
			dph: r.celkem[21].dph
		} },
		{ h: {
			radek: "2",
			popis: "Dodání zboží / poskytnutí služeb – snížená sazba 12 %",
			zaklad: r.celkem[12].zaklad,
			dph: r.celkem[12].dph
		} },
		{ h: {
			radek: "26",
			popis: "Plnění osvobozená bez nároku na odpočet / mimo předmět (jen hodnota)",
			zaklad: r.celkem[0].zaklad,
			dph: null
		} }
	], a = r.a4.map((e) => ({
		h: {
			dic: e.dicOdberatele,
			odberatel: e.odberatel,
			doklad: e.evidencniCislo,
			dppd: e.dppd,
			zaklad21: e.rozpis[21].zaklad,
			dph21: e.rozpis[21].dph,
			zaklad12: e.rozpis[12].zaklad,
			dph12: e.rozpis[12].dph,
			kodRezimu: "0"
		},
		zdroje: [e.zdroj]
	})), s = (e, t) => o(e, (e) => Number(e.h[t] ?? 0));
	return a.length && a.push({
		h: {
			odberatel: `Celkem ${r.a4.length} dokladů`,
			zaklad21: s(a, "zaklad21"),
			dph21: s(a, "dph21"),
			zaklad12: s(a, "zaklad12"),
			dph12: s(a, "dph12")
		},
		druh: "soucet"
	}), {
		id: "dph",
		kod: "sest_dph",
		nazev: "Podklad pro DPH a kontrolní hlášení",
		obdobi: R(t),
		popis: "Uskutečněná plnění z vystavených faktur (podle DUZP) a samostatných pokladních dokladů. Přijatá plnění (oddíl B) export IC Office neobsahuje.",
		orientace: "landscape",
		tabulky: [
			{
				nadpis: "Přiznání k DPH – uskutečněná plnění na výstupu",
				sloupce: [
					{
						klic: "radek",
						nazev: "Ř.",
						typ: "text",
						sirka: .3
					},
					{
						klic: "popis",
						nazev: "Popis",
						typ: "text",
						sirka: 4
					},
					z("zaklad", "Základ daně", 1.2),
					z("dph", "Daň", 1.2)
				],
				radky: i
			},
			{
				nadpis: "Kontrolní hlášení A.4 – plnění nad 10 000 Kč plátcům DPH",
				sloupce: [
					{
						klic: "dic",
						nazev: "DIČ odběratele",
						typ: "text",
						sirka: 1.1
					},
					{
						klic: "odberatel",
						nazev: "Odběratel",
						typ: "text",
						sirka: 1.8
					},
					{
						klic: "doklad",
						nazev: "Evidenční číslo",
						typ: "text",
						sirka: .9
					},
					{
						klic: "dppd",
						nazev: "DPPD",
						typ: "datum",
						sirka: .8
					},
					z("zaklad21", "Základ 21 %"),
					z("dph21", "DPH 21 %"),
					z("zaklad12", "Základ 12 %"),
					z("dph12", "DPH 12 %"),
					{
						klic: "kodRezimu",
						nazev: "Režim",
						typ: "text",
						sirka: .4
					}
				],
				radky: a
			},
			{
				nadpis: "Kontrolní hlášení A.5 – ostatní plnění souhrnně",
				sloupce: [
					{
						klic: "sazba",
						nazev: "Sazba",
						typ: "text",
						sirka: 1
					},
					z("zaklad", "Základ daně", 1.2),
					z("dph", "Daň", 1.2)
				],
				radky: [{ h: {
					sazba: "Základní 21 %",
					zaklad: r.a5[21].zaklad,
					dph: r.a5[21].dph
				} }, { h: {
					sazba: "Snížená 12 %",
					zaklad: r.a5[12].zaklad,
					dph: r.a5[12].dph
				} }]
			}
		],
		souhrny: [{
			nadpis: "Daň na výstupu",
			polozky: [
				{
					nazev: "Z faktur",
					hodnota: n(r.zFaktur[21].dph + r.zFaktur[12].dph),
					typ: "kc"
				},
				{
					nazev: "Z pokladny",
					hodnota: n(r.zPokladny[21].dph + r.zPokladny[12].dph),
					typ: "kc"
				},
				{
					nazev: "Celkem",
					hodnota: n(r.celkem[21].dph + r.celkem[12].dph),
					typ: "kc",
					zvyraznit: !0
				}
			]
		}],
		upozorneni: [...r.upozorneni, "Odpočet daně (přijaté faktury, ř. 40–47 přiznání a oddíl B kontrolního hlášení) doplní účetní z evidence přijatých dokladů."],
		chybiData: e.faktury.length || e.pokladna.length ? void 0 : "Načtěte export Vystavené faktury a Pokladna."
	};
}
function X(e, t, n) {
	let r = e.soubory.find((e) => e.druh === "mechanici")?.obdobi;
	return [
		V(e, t, n),
		G(e, t, n),
		K(e, r ? R(r) : "podle souboru"),
		q(e, t, n),
		J(e, n),
		Y(e, n)
	];
}
export { S as a, P as i, X as n, x as o, C as r, I as t };
