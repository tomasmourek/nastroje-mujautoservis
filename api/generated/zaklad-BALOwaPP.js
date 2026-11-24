// src/lib/zaklad.ts
function e(e) {
	return Math.round((e + 2 ** -52) * 100) / 100;
}
function t(t, n) {
	let r = 0;
	for (let e of t) r += n(e);
	return e(r);
}
function n(e) {
	if (typeof e == "number") return Number.isFinite(e) ? e : 0;
	if (e == null) return 0;
	let t = String(e).replace(/Kč|CZK|%/gi, "").replace(/\s| /g, "");
	if (!t) return 0;
	let n = Number(t.includes(".") ? t.replace(/,/g, "") : t.replace(",", "."));
	return Number.isFinite(n) ? n : 0;
}
function r(e) {
	if (typeof e == "number") return Number.isFinite(e) ? e : null;
	if (typeof e != "string") return null;
	let t = e.trim().replace(/\s*(?:Kč|CZK)$/i, "");
	if (!/^-?(?:\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:[.,]\d+)?$/.test(t)) return null;
	let n = Number(t.replace(/\s/g, "").replace(",", "."));
	return Number.isFinite(n) ? n : null;
}
function i(e) {
	return e == null ? "" : String(e).replace(/_x000D_/g, "").trim();
}
function a(e) {
	return i(e).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
function o(e) {
	if (e instanceof Date && !Number.isNaN(e.getTime())) return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
	let t = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/.exec(i(e));
	if (t) return `${t[3]}-${t[2].padStart(2, "0")}-${t[1].padStart(2, "0")}`;
	let n = /^(\d{4})-(\d{2})-(\d{2})/.exec(i(e));
	return n ? `${n[1]}-${n[2]}-${n[3]}` : "";
}
function s(e) {
	let t = /(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(i(e));
	return t ? `${t[1].padStart(2, "0")}:${t[2]}:${t[3] ?? "00"}` : "";
}
function c(e, t, n) {
	return !!e && (!t || e >= t) && (!n || e <= n);
}
var l = new Intl.NumberFormat("cs-CZ", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
}), u = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });
function d(t) {
	return l.format(e(t) === 0 ? 0 : t);
}
function f(e) {
	return u.format(e);
}
function p(e) {
	let t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e);
	return t ? `${t[3]}.${t[2]}.${t[1]}` : e;
}
function m(e) {
	let [t, n] = e.split("-").map(Number), r = new Date(t, n, 0).getDate();
	return {
		od: `${e}-01`,
		do: `${e}-${String(r).padStart(2, "0")}`
	};
}
var h = [
	"leden",
	"únor",
	"březen",
	"duben",
	"květen",
	"červen",
	"červenec",
	"srpen",
	"září",
	"říjen",
	"listopad",
	"prosinec"
];
function g(e) {
	let [t, n] = e.split("-").map(Number);
	return `${h[n - 1]} ${t}`;
}
function _(e) {
	return i(e).replace(/^[A-Za-z]{2}/, "").replace(/\s/g, "");
}
function v(e) {
	return /^CZ\d{8,10}$/i.test(i(e).replace(/\s/g, ""));
}
export { p as a, d as c, g as d, r as f, c as g, i as h, o as i, a as l, t as m, f as n, _ as o, e as p, n as r, v as s, s as t, m as u };
