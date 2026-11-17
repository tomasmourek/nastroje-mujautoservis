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
	return e == null ? "" : String(e).replace(/_x000D_/g, "").trim();
}
function i(e) {
	return r(e).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
function a(e) {
	if (e instanceof Date && !Number.isNaN(e.getTime())) return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
	let t = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/.exec(r(e));
	if (t) return `${t[3]}-${t[2].padStart(2, "0")}-${t[1].padStart(2, "0")}`;
	let n = /^(\d{4})-(\d{2})-(\d{2})/.exec(r(e));
	return n ? `${n[1]}-${n[2]}-${n[3]}` : "";
}
function o(e) {
	let t = /(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(r(e));
	return t ? `${t[1].padStart(2, "0")}:${t[2]}:${t[3] ?? "00"}` : "";
}
function s(e, t, n) {
	return !!e && (!t || e >= t) && (!n || e <= n);
}
var c = new Intl.NumberFormat("cs-CZ", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
}), l = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });
function u(t) {
	return c.format(e(t) === 0 ? 0 : t);
}
function d(e) {
	return l.format(e);
}
function f(e) {
	let t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e);
	return t ? `${t[3]}.${t[2]}.${t[1]}` : e;
}
function p(e) {
	let [t, n] = e.split("-").map(Number), r = new Date(t, n, 0).getDate();
	return {
		od: `${e}-01`,
		do: `${e}-${String(r).padStart(2, "0")}`
	};
}
var m = [
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
function h(e) {
	let [t, n] = e.split("-").map(Number);
	return `${m[n - 1]} ${t}`;
}
function g(e) {
	return r(e).replace(/^[A-Za-z]{2}/, "").replace(/\s/g, "");
}
function _(e) {
	return /^CZ\d{8,10}$/i.test(r(e).replace(/\s/g, ""));
}
export { f as a, u as c, h as d, e as f, s as h, a as i, i as l, r as m, d as n, g as o, t as p, n as r, _ as s, o as t, p as u };
