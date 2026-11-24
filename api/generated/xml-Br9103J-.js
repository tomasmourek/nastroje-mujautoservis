import { g as e, l as t, p as n, u as r } from "./zaklad-BALOwaPP.js";
import { l as i } from "./vypocty-DWCkItoB.js";
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
function s(t, n, r) {
	return i(t).filter((t) => e(t.f.duzp, n, r)).map(({ f: e, polozky: t, rozpis: n }) => ({
		f: e,
		polozky: t,
		rozpis: n
	}));
}
function c(t, n, r) {
	return t.pokladna.filter((t) => !t.faktura && e(t.datum, n, r));
}
function l(e) {
	let n = t(e);
	return n.startsWith("hotov") ? "hotove" : n.includes("kart") ? "karta" : n.startsWith("prevod") ? "prevod" : n.startsWith("dobir") ? "dobirka" : "jine";
}
function u(e) {
	return e.sazba >= 17 ? 21 : e.sazba > 0 ? 12 : 0;
}
function d(e, t) {
	let r = e.dobropis ? -1 : 1, i = r * Math.abs(t.bez), a = r * Math.abs(t.dph), o = t.mnozstvi || 1;
	return {
		bez: i,
		dph: a,
		s: n(i + a),
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
