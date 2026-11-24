import { t as e } from "./vypocty-DWCkItoB.js";
import { m as t, p as n } from "./zaklad-BALOwaPP.js";
import { a as r, d as i, f as a, i as o, l as s, n as c, o as l, p as u, r as d, s as f, t as p, u as m } from "./xml-Br9103J-.js";
// src/lib/export/cp1250.ts
var h = null;
function g() {
	let e = /* @__PURE__ */ new Map(), t = new TextDecoder("windows-1250");
	for (let n = 0; n < 256; n++) {
		let r = t.decode(new Uint8Array([n]));
		r !== "�" && !e.has(r) && e.set(r, n);
	}
	return e;
}
function _(e) {
	h ??= g();
	let t = new Uint8Array(e.length), n = 0;
	for (let r of e) t[n++] = h.get(r) ?? 63;
	return t.slice(0, n);
}
// src/lib/export/pohoda.ts
var v = {
	"xmlns:dat": "http://www.stormware.cz/schema/version_2/data.xsd",
	"xmlns:inv": "http://www.stormware.cz/schema/version_2/invoice.xsd",
	"xmlns:vch": "http://www.stormware.cz/schema/version_2/voucher.xsd",
	"xmlns:typ": "http://www.stormware.cz/schema/version_2/type.xsd"
}, y = {
	21: "high",
	12: "low",
	0: "none"
}, b = {
	hotove: "cash",
	karta: "creditcard",
	prevod: "draft",
	dobirka: "delivery",
	jine: "draft"
};
function x(e, t, n, i) {
	let s = a(t);
	return r("typ:address", d("typ:company", e), o("typ:city", s.obec), o("typ:street", s.ulice), o("typ:zip", s.psc), o("typ:ico", n), o("typ:dic", i));
}
function S(e, t, n) {
	return r(`${e}:homeCurrency`, d("typ:priceNone", c(t[0].zaklad + n)), d("typ:priceLow", c(t[12].zaklad)), d("typ:priceLowVAT", c(t[12].dph)), d("typ:priceLowSum", c(t[12].zaklad + t[12].dph)), d("typ:priceHigh", c(t[21].zaklad)), d("typ:priceHighVAT", c(t[21].dph)), d("typ:priceHighSum", c(t[21].zaklad + t[21].dph)));
}
function C({ f: t, polozky: n, rozpis: i }, a) {
	let m = s(t.forma), h = n.map((e) => {
		let n = f(t, e);
		return r("inv:invoiceItem", o("inv:code", e.kod), d("inv:text", e.nazev.slice(0, 90)), d("inv:quantity", l(n.mnozstvi)), o("inv:unit", e.jednotka), d("inv:payVAT", "false"), d("inv:rateVAT", y[u(e)]), r("inv:homeCurrency", d("typ:unitPrice", l(n.cenaMj)), d("typ:price", c(n.bez)), d("typ:priceVAT", c(n.dph)), d("typ:priceSum", c(n.s))));
	});
	if (!n.length) for (let n of e) i[n].zaklad && h.push(r("inv:invoiceItem", d("inv:text", t.popis || `Faktura ${t.cislo}`), d("inv:quantity", "1"), d("inv:payVAT", "false"), d("inv:rateVAT", y[n]), r("inv:homeCurrency", d("typ:unitPrice", c(i[n].zaklad)), d("typ:price", c(i[n].zaklad)), d("typ:priceVAT", c(i[n].dph)))));
	t.zaokrouhleni && h.push(r("inv:invoiceItem", d("inv:text", "Zaokrouhlení"), d("inv:quantity", "1"), d("inv:payVAT", "false"), d("inv:rateVAT", "none"), r("inv:homeCurrency", d("typ:unitPrice", c(t.zaokrouhleni)), d("typ:price", c(t.zaokrouhleni)), d("typ:priceVAT", "0.00"), d("typ:priceSum", c(t.zaokrouhleni)))));
	let g = r("inv:invoiceHeader", d("inv:invoiceType", t.dobropis ? "issuedCreditNotice" : "issuedInvoice"), r("inv:number", d("typ:numberRequested", t.cislo)), o("inv:symVar", t.vs || t.cislo), d("inv:date", t.vystaveni), d("inv:dateTax", t.duzp), o("inv:dateAccounting", t.duzp), o("inv:dateDue", t.splatnost), a.predkontaceFaktur ? r("inv:accounting", d("typ:ids", a.predkontaceFaktur)) : "", r("inv:classificationVAT", a.cleniDph ? d("typ:ids", a.cleniDph) : d("typ:classificationVATType", "inland")), d("inv:text", (t.popis || (t.zakazka ? `Zakázka ${t.zakazka}` : `Faktura ${t.cislo}`)).slice(0, 240)), r("inv:partnerIdentity", x(t.zakaznik, t.adresa, t.ico, t.dic)), r("inv:paymentType", d("typ:paymentType", b[m])), o("inv:note", t.zakazka ? `Zakázka ${t.zakazka}` : ""), d("inv:intNote", "Import z IC Office (Účetní sestavy).")), _ = r("inv:invoiceSummary", d("inv:roundingDocument", "none"), d("inv:roundingVAT", "none"), S("inv", i, t.zaokrouhleni));
	return `<dat:dataPackItem${p({
		version: "2.0",
		id: `FV${t.cislo}`
	})}><inv:invoice version="2.0">${g}${r("inv:invoiceDetail", ...h)}${_}</inv:invoice></dat:dataPackItem>`;
}
function w(i, a) {
	let o = t(e, (e) => i.sazby[e].zaklad), s = t(e, (e) => i.sazby[e].dph), c = n(i.prijem - i.vydej - o - s), l = i.prijem >= i.vydej, u = r("vch:voucherHeader", d("vch:voucherType", l ? "receipt" : "expense"), a.zkratkaPokladny ? r("vch:cashAccount", d("typ:ids", a.zkratkaPokladny)) : "", r("vch:number", d("typ:numberRequested", i.cislo)), d("vch:date", i.datum), d("vch:datePayment", i.datum), d("vch:dateTax", i.datum), a.predkontacePokladny ? r("vch:accounting", d("typ:ids", a.predkontacePokladny)) : "", r("vch:classificationVAT", a.cleniDph ? d("typ:ids", a.cleniDph) : d("typ:classificationVATType", "inland")), d("vch:text", (i.popis || "Prodej za hotové").slice(0, 240)), d("vch:intNote", "Import z IC Office (Účetní sestavy).")), f = r("vch:voucherSummary", d("vch:roundingDocument", "none"), d("vch:roundingVAT", "none"), S("vch", i.sazby, c));
	return `<dat:dataPackItem${p({
		version: "2.0",
		id: `PD${i.cislo}`
	})}><vch:voucher version="2.0">${u}${f}</vch:voucher></dat:dataPackItem>`;
}
function T(e, t, n, r) {
	let a = [...m(e, n, r).map((e) => C(e, t)), ...i(e, n, r).map((e) => w(e, t))], o = t.firma.ico.replace(/\s/g, "");
	return _(`<?xml version="1.0" encoding="Windows-1250"?>\n<dat:dataPack${p({
		...v,
		id: `ICO-${n}`,
		ico: o,
		application: "Ucetni sestavy IC Office",
		version: "2.0",
		note: `Doklady ${n} až ${r}`
	})}>\n` + a.join("\n") + "\n</dat:dataPack>\n");
}
export { T as pohodaXml };
