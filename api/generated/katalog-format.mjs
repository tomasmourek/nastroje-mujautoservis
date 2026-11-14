import * as e from "xlsx";
// src/lib/zaklad.ts
function t(e) {
	return e == null ? "" : String(e).replace(/_x000D_/g, "").trim();
}
function n(e) {
	return t(e).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
new Intl.NumberFormat("cs-CZ", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
}), new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });
// src/lib/google-sklady.ts
function r(r) {
	let i = e.read(r, { type: "array" }), a = e.utils.sheet_to_json(i.Sheets[i.SheetNames[0]], {
		header: 1,
		defval: ""
	}), o = a.findIndex((e) => [
		"kod",
		"nazev",
		"sklad",
		"mnozstvi"
	].every((t) => e.some((e) => n(e) === t)));
	if (o < 0) throw Error("Vyberte export Excel z IC Office → Sklady → Všechno zboží.");
	let s = a[o].map(n);
	return a.slice(o + 1).map((e, t) => ({
		r: e,
		cisloRadku: o + t + 2
	})).filter(({ r: e }) => e.some((e) => t(e))).map(({ r: e, cisloRadku: n }) => {
		let r = (n) => t(e[s.indexOf(n)]), i = r("mnozstvi").replace(/\s/g, "").replace(",", "."), a = Number(i);
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
function i(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.kod;
		t.set(e, [...t.get(e) ?? [], n]);
	}
	return [...t].sort(([e], [t]) => e.localeCompare(t)).map(([e, t]) => {
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
var a = (e) => e.replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
function o(e) {
	return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0" xmlns:ic="https://nastroje.mujautoservis.eu/sklady/1.0"><channel>
<title>IC Office – pracovní katalog všech skladů</title>
<description>NEÚPLNÉ: určeno k přípravě napojení e-shopu, nepředávat do Merchant Center.</description>
${i(e).map((t) => `<item><g:id>${a(t.id)}</g:id><g:title>${a(t.nazev)}</g:title><g:description>${a(t.popis)}</g:description><ic:quantity>${t.mnozstvi}</ic:quantity><ic:issues>${a(t.chyby.join(" "))}</ic:issues>${e.filter((e) => e.kod === t.id).map((e) => `<ic:stock><ic:code>${a(e.kod)}</ic:code><ic:title>${a(e.nazev)}</ic:title><ic:description>${a(e.popis)}</ic:description><ic:warehouse>${a(e.sklad)}</ic:warehouse><ic:location>${a(e.misto)}</ic:location><ic:quantity>${e.mnozstvi}</ic:quantity><ic:unit>${a(e.jednotka)}</ic:unit><ic:ean>${a(e.ean)}</ic:ean><ic:manufacturer_code>${a(e.vyrobniCislo)}</ic:manufacturer_code></ic:stock>`).join("")}</item>`).join("\n")}
</channel></rss>`;
}
var s = {
	cetnost: "denne",
	cas: "06:00",
	denTydne: 1,
	denMesice: 1,
	zona: "Europe/Prague"
}, c = "ic-office-google-sklady-plan-v1";
function l(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	return [
		"denne",
		"tydne",
		"mesicne"
	].includes(t.cetnost) && /^([01]\d|2[0-3]):[0-5]\d$/.test(t.cas) && Number.isInteger(t.denTydne) && t.denTydne >= 1 && t.denTydne <= 7 && Number.isInteger(t.denMesice) && t.denMesice >= 1 && t.denMesice <= 31 && t.zona === "Europe/Prague";
}
function u(e, t = /* @__PURE__ */ new Date()) {
	if (!l(e) || !Number.isFinite(t.getTime())) throw Error("Neplatné nastavení běhu.");
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
export { c as KLIC_PLANU_SKLADU, s as VYCHOZI_PLAN_SKLADU, l as platnyPlanSkladu, o as pracovniGoogleXml, r as precistKatalog, u as pristiTerminSkladu, i as produktyGoogle };
