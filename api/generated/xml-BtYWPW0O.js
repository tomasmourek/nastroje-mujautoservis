import { f as e, h as t, l as n, u as r } from "./zaklad-Xwu_hcf2.js";
import { l as i } from "./vypocty-cReu2eaY.js";
// src/lib/export/doklady.ts
function a(e) {
	let [t = "", n = "", r = ""] = e.split(",").map((e) => e.trim());
	return {
		ulice: t,
		obec: n,
		psc: r
	};
}
function o(e) {
	let t = /^(.*?)[\s,]+(\d+[\w/]*)$/.exec(e.trim());
	return t ? {
		ulice: t[1],
		cislo: t[2]
	} : {
		ulice: e.trim(),
		cislo: ""
	};
}
function s(e, n, r) {
	return i(e).filter((e) => t(e.f.duzp, n, r)).map(({ f: e, polozky: t, rozpis: n }) => ({
		f: e,
		polozky: t,
		rozpis: n
	}));
}
function c(e, n, r) {
	return e.pokladna.filter((e) => !e.faktura && t(e.datum, n, r));
}
function l(e) {
	let t = n(e);
	return t.startsWith("hotov") ? "hotove" : t.includes("kart") ? "karta" : t.startsWith("prevod") ? "prevod" : t.startsWith("dobir") ? "dobirka" : "jine";
}
function u(e) {
	return e.sazba >= 17 ? 21 : e.sazba > 0 ? 12 : 0;
}
function d(t, n) {
	let r = t.dobropis ? -1 : 1, i = r * Math.abs(n.bez), a = r * Math.abs(n.dph), o = n.mnozstvi || 1;
	return {
		bez: i,
		dph: a,
		s: e(i + a),
		mnozstvi: o,
		cenaMj: i / o,
		cenaMjS: (i + a) / o
	};
}
function f(e, t) {
	if (e === t) return e;
	let n = r(e.slice(0, 7));
	return e === n.od && t === n.do ? e.slice(0, 7) : `${e}_${t}`;
}
// src/lib/export/xml.ts
function p(e) {
	return String(e ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function m(e, t) {
	let n = p(t);
	return n ? `<${e}>${n}</${e}>` : `<${e}/>`;
}
function h(e, t) {
	return t === "" || t == null ? "" : m(e, t);
}
function g(e, ...t) {
	return `<${e}>${t.join("")}</${e}>`;
}
function _(e) {
	return Object.entries(e).filter(([, e]) => e !== "" && e != null).map(([e, t]) => ` ${e}="${p(t)}"`).join("");
}
function v(e) {
	return (Math.round((e + 2 ** -52) * 100) / 100).toFixed(2);
}
function y(e, t = 4) {
	return String(Number(e.toFixed(t)));
}
export { g as a, f as c, c as d, a as f, h as i, l, o as m, v as n, y as o, u as p, m as r, d as s, _ as t, s as u };
