import { h as e, l as t } from "./zaklad-BALOwaPP.js";
import * as n from "xlsx";
// src/lib/google-sklady.ts
var r = {
	kod: "Kód zboží",
	nazev: "Název",
	popis: "Popis",
	ean: "EAN",
	vyrobniCislo: "Výrobní číslo",
	sklad: "Sklad",
	misto: "Místo ve skladu",
	jednotka: "Jednotka",
	mnozstvi: "Množství"
}, i = Object.keys(r), a = {
	sklady: null,
	jenSkladem: !1,
	format: null
}, o = {
	koren: "katalog",
	polozka: "polozka",
	pole: {
		kod: "kod",
		nazev: "nazev",
		popis: "popis",
		ean: "ean",
		vyrobniCislo: "vyrobni_cislo",
		sklad: "sklad",
		misto: "misto",
		jednotka: "jednotka",
		mnozstvi: "mnozstvi"
	}
};
function s(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function c(e) {
	return typeof e == "string" && /^(?!xml)[A-Z_][\w.-]{0,63}$/i.test(e);
}
function l(e) {
	if (!s(e) || Object.keys(e).length !== 3 || typeof e.jenSkladem != "boolean") return !1;
	let { sklady: t, format: n } = e;
	if (t !== null && (!Array.isArray(t) || t.length < 1 || t.length > 50 || new Set(t).size !== t.length || !t.every((e) => typeof e == "string" && e.length <= 200 && e.trim() && e === e.trim()))) return !1;
	if (n === null) return !0;
	if (!s(n) || Object.keys(n).length !== 3 || !c(n.koren) || !c(n.polozka) || !s(n.pole)) return !1;
	let i = Object.entries(n.pole);
	return i.length > 0 && i.every(([e, t]) => Object.hasOwn(r, e) && c(t)) && new Set(i.map(([, e]) => e)).size === i.length;
}
function u(e) {
	return [...new Set(e.map((e) => e.sklad))].sort((e, t) => e.localeCompare(t, "cs"));
}
function d(e, t) {
	let n = t.sklady === null ? null : new Set(t.sklady);
	return e.filter((e) => (!n || n.has(e.sklad)) && (!t.jenSkladem || e.mnozstvi > 0));
}
function f(r) {
	let i = n.read(r, { type: "array" }), a = n.utils.sheet_to_json(i.Sheets[i.SheetNames[0]], {
		header: 1,
		defval: ""
	}), o = a.findIndex((e) => [
		"kod",
		"nazev",
		"sklad",
		"mnozstvi"
	].every((n) => e.some((e) => t(e) === n)));
	if (o < 0) throw Error("Vyberte export Excel z IC Office → Sklady → Všechno zboží.");
	let s = a[o].map(t);
	return a.slice(o + 1).map((e, t) => ({
		r: e,
		cisloRadku: o + t + 2
	})).filter(({ r: t }) => t.some((t) => e(t))).map(({ r: t, cisloRadku: n }) => {
		let r = (n) => e(t[s.indexOf(n)]), i = r("mnozstvi").replace(/\s/g, "").replace(",", "."), a = Number(i);
		if (!i || !Number.isFinite(a) || !r("sklad")) throw Error(`Řádek ${n}: chybí sklad nebo platné množství. Předchozí snímek zůstává zachován.`);
		return {
			kod: r("kod"),
			nazev: r("nazev"),
			popis: r("popis"),
			ean: r("ean"),
			vyrobniCislo: r("vyrobni cislo"),
			sklad: r("sklad"),
			misto: r("misto skladu"),
			jednotka: r("jednotka"),
			mnozstvi: a
		};
	});
}
function p(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = t.get(n.kod);
		e ? e.push(n) : t.set(n.kod, [n]);
	}
	return t;
}
function m(e) {
	return [...p(e)].sort(([e], [t]) => e.localeCompare(t)).map(([e, t]) => {
		let n = t[0], r = ["Chybí produktový odkaz, obrázek a ověřená prodejní cena z e-shopu."];
		(!e || e.length > 50) && r.push("Chybí jednoznačný kód do 50 znaků."), t.some((e) => !e.nazev) && r.push("Chybí název produktu."), n.popis || r.push("Chybí popis produktu."), t.some((e) => e.nazev !== n.nazev || e.ean !== n.ean || e.jednotka !== n.jednotka || e.vyrobniCislo !== n.vyrobniCislo) && r.push("Kód označuje různé produkty; před napojením je nutné jej rozlišit.");
		let i = t.reduce((e, t) => e + t.mnozstvi, 0);
		if (!Number.isFinite(i)) throw Error("Součet množství překročil podporovaný rozsah.");
		return {
			id: e,
			nazev: n.nazev,
			popis: n.popis,
			ean: n.ean,
			mnozstvi: i,
			sklady: [...new Set(t.map((e) => e.sklad))].sort(),
			chyby: r
		};
	});
}
var h = (e) => e.replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
function g(e, t = !1) {
	let n = p(e);
	return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0" xmlns:ic="https://nastroje.mujautoservis.eu/sklady/1.0"><channel>
<title>IC Office – pracovní katalog ${t ? "vybraných skladů" : "všech skladů"}</title>
<description>NEÚPLNÉ: určeno k přípravě napojení e-shopu, nepředávat do Merchant Center.</description>
${m(e).map((e) => `<item><g:id>${h(e.id)}</g:id><g:title>${h(e.nazev)}</g:title><g:description>${h(e.popis)}</g:description><ic:quantity>${e.mnozstvi}</ic:quantity><ic:issues>${h(e.chyby.join(" "))}</ic:issues>${n.get(e.id)?.map((e) => `<ic:stock><ic:code>${h(e.kod)}</ic:code><ic:title>${h(e.nazev)}</ic:title><ic:description>${h(e.popis)}</ic:description><ic:warehouse>${h(e.sklad)}</ic:warehouse><ic:location>${h(e.misto)}</ic:location><ic:quantity>${e.mnozstvi}</ic:quantity><ic:unit>${h(e.jednotka)}</ic:unit><ic:ean>${h(e.ean)}</ic:ean><ic:manufacturer_code>${h(e.vyrobniCislo)}</ic:manufacturer_code></ic:stock>`).join("") ?? ""}</item>`).join("\n")}
</channel></rss>`;
}
function _(e, t = a) {
	if (!l(t)) throw Error("Zkontrolujte nastavení XML.");
	let n = d(e, t);
	if (!t.format) return g(n, t.sklady !== null);
	let { koren: r, polozka: o, pole: s } = t.format;
	return `<?xml version="1.0" encoding="UTF-8"?>\n<${r}>\n${n.map((e) => {
		let t = i.flatMap((t) => {
			let n = s[t];
			return n ? [`<${n}>${h(String(e[t]))}</${n}>`] : [];
		});
		return `  <${o}>${t.join("")}</${o}>`;
	}).join("\n")}\n</${r}>`;
}
var v = {
	cetnost: "denne",
	cas: "06:00",
	denTydne: 1,
	denMesice: 1,
	zona: "Europe/Prague"
}, y = "ic-office-google-sklady-plan-v1";
function b(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	return [
		"denne",
		"tydne",
		"mesicne"
	].includes(t.cetnost) && /^([01]\d|2[0-3]):[0-5]\d$/.test(t.cas) && Number.isInteger(t.denTydne) && t.denTydne >= 1 && t.denTydne <= 7 && Number.isInteger(t.denMesice) && t.denMesice >= 1 && t.denMesice <= 31 && t.zona === "Europe/Prague";
}
function x(e, t = /* @__PURE__ */ new Date()) {
	if (!b(e) || !Number.isFinite(t.getTime())) throw Error("Neplatné nastavení běhu.");
	let n = new Intl.DateTimeFormat("sv-SE", {
		timeZone: e.zona,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	}), r = Math.floor(t.getTime() / 6e4) * 6e4 + 6e4;
	for (let t = r; t < r + 54432e5; t += 6e4) {
		let r = new Date(t), i = n.format(r);
		if (i.slice(11) !== e.cas || n.format(/* @__PURE__ */ new Date(t - 36e5)) === i) continue;
		let a = /* @__PURE__ */ new Date(`${i.slice(0, 10)}T12:00:00Z`), o = a.getUTCDate(), s = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + 1, 0)).getUTCDate();
		if (e.cetnost === "denne" || e.cetnost === "tydne" && (a.getUTCDay() || 7) === e.denTydne || e.cetnost === "mesicne" && o === Math.min(e.denMesice, s)) return r;
	}
	throw Error("Termín se nepodařilo vypočítat.");
}
export { y as KLIC_PLANU_SKLADU, i as KOD_POLE_XML, r as POLE_SKLADOVEHO_XML, v as VYCHOZI_PLAN_SKLADU, a as VYCHOZI_SKLADOVE_XML, o as VYCHOZI_VLASTNI_XML, u as nazvySkladu, l as platneNastaveniSkladovehoXml, b as platnyPlanSkladu, g as pracovniGoogleXml, f as precistKatalog, x as pristiTerminSkladu, m as produktyGoogle, _ as skladoveXml, d as vybratSkladovePolozky };
