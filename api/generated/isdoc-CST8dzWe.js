import { r as e } from "./rolldown-runtime-DfEuXgQw.js";
import { t } from "./vypocty-DWCkItoB.js";
import { m as n, p as r } from "./zaklad-BALOwaPP.js";
import { a as i, f as a, l as o, m as s, n as c, o as l, p as u, r as d, s as f, u as p } from "./xml-Br9103J-.js";
// src/lib/export/isdoc.ts
async function m(e, t) {
	let n = new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(`isdoc|${e}|${t}`)));
	n[6] = n[6] & 15 | 80, n[8] = n[8] & 63 | 128;
	let r = [...n.slice(0, 16)].map((e) => e.toString(16).padStart(2, "0")).join("").toUpperCase();
	return `${r.slice(0, 8)}-${r.slice(8, 12)}-${r.slice(12, 16)}-${r.slice(16, 20)}-${r.slice(20, 32)}`;
}
function h(e, t, n, r, a, o, s) {
	return i("Party", i("PartyIdentification", d("ID", t)), i("PartyName", d("Name", e)), i("PostalAddress", d("StreetName", r), d("BuildingNumber", a), d("CityName", o), d("PostalZone", s.replace(/\s/g, "")), i("Country", d("IdentificationCode", "CZ"), d("Name", "Česká republika"))), n ? i("PartyTaxScheme", d("CompanyID", n.replace(/\s/g, "").toUpperCase()), d("TaxScheme", "VAT")) : "");
}
async function g(e, p) {
	let { f: g, polozky: _, rozpis: v } = e, y = a(g.adresa), b = s(y.ulice), x = _.map((e, t) => {
		let n = f(g, e);
		return i("InvoiceLine", d("ID", t + 1), `<InvoicedQuantity unitCode="${e.jednotka && e.jednotka.replace(/[^\p{L}\d.]/gu, "").slice(0, 10) || "ks"}">${l(n.mnozstvi)}</InvoicedQuantity>`, d("LineExtensionAmount", c(n.bez)), d("LineExtensionAmountTaxInclusive", c(n.s)), d("LineExtensionTaxAmount", c(n.dph)), d("UnitPrice", l(n.cenaMj)), d("UnitPriceTaxInclusive", l(n.cenaMjS)), i("ClassifiedTaxCategory", d("Percent", u(e)), d("VATCalculationMethod", "0")), i("Item", d("Description", e.nazev), e.kod ? i("SellersItemIdentification", d("ID", e.kod)) : ""));
	});
	if (!_.length) {
		let e = 0;
		for (let n of t) {
			if (!v[n].zaklad) continue;
			let t = r(v[n].zaklad + v[n].dph);
			x.push(i("InvoiceLine", d("ID", ++e), "<InvoicedQuantity unitCode=\"ks\">1</InvoicedQuantity>", d("LineExtensionAmount", c(v[n].zaklad)), d("LineExtensionAmountTaxInclusive", c(t)), d("LineExtensionTaxAmount", c(v[n].dph)), d("UnitPrice", c(v[n].zaklad)), d("UnitPriceTaxInclusive", c(t)), i("ClassifiedTaxCategory", d("Percent", n), d("VATCalculationMethod", "0")), i("Item", d("Description", g.popis || `Faktura ${g.cislo}`))));
		}
	}
	let S = t.filter((e) => v[e].zaklad || v[e].dph), C = S.map((e) => {
		let t = v[e].zaklad, n = v[e].dph;
		return i("TaxSubTotal", d("TaxableAmount", c(t)), d("TaxAmount", c(n)), d("TaxInclusiveAmount", c(t + n)), d("AlreadyClaimedTaxableAmount", "0.00"), d("AlreadyClaimedTaxAmount", "0.00"), d("AlreadyClaimedTaxInclusiveAmount", "0.00"), d("DifferenceTaxableAmount", c(t)), d("DifferenceTaxAmount", c(n)), d("DifferenceTaxInclusiveAmount", c(t + n)), i("TaxCategory", d("Percent", e)));
	}), w = n(S, (e) => v[e].zaklad), T = n(S, (e) => v[e].dph), E = r(w + T), D = r(E + g.zaokrouhleni), O = s(p.ulice + (p.cisloPopisne ? ` ${p.cisloPopisne}` : "")), k = o(g.forma) === "prevod" && p.cisloUctu && p.kodBanky ? i("Payment", d("PaidAmount", c(D)), d("PaymentMeansCode", "42"), i("Details", d("PaymentDueDate", g.splatnost || g.vystaveni), d("ID", p.cisloUctu), d("BankCode", p.kodBanky), d("Name", ""), d("IBAN", ""), d("BIC", ""), d("VariableSymbol", (g.vs || g.cislo).replace(/\D/g, "").slice(0, 10)))) : i("Payment", d("PaidAmount", c(D)), d("PaymentMeansCode", o(g.forma) === "karta" ? "48" : o(g.forma) === "hotove" ? "10" : "42")), A = await m(p.ico, g.cislo);
	return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Invoice xmlns=\"http://isdoc.cz/namespace/2013\" version=\"6.0.2\">" + d("DocumentType", g.dobropis ? "2" : "1") + d("ID", g.cislo) + d("UUID", A) + d("IssueDate", g.vystaveni) + d("TaxPointDate", g.duzp) + d("VATApplicable", "true") + d("ElectronicPossibilityAgreementReference", "") + d("Note", g.zakazka ? `Zakázka ${g.zakazka}` : "") + d("LocalCurrencyCode", "CZK") + d("CurrRate", "1") + d("RefCurrRate", "1") + i("AccountingSupplierParty", h(p.nazev, p.ico.replace(/\s/g, ""), p.dic, O.ulice, O.cislo, p.obec, p.psc)) + i("AccountingCustomerParty", h(g.zakaznik, g.ico, g.dic, b.ulice, b.cislo, y.obec, y.psc)) + i("InvoiceLines", ...x) + i("TaxTotal", ...C, d("TaxAmount", c(T))) + i("LegalMonetaryTotal", d("TaxExclusiveAmount", c(w)), d("TaxInclusiveAmount", c(E)), d("AlreadyClaimedTaxExclusiveAmount", "0.00"), d("AlreadyClaimedTaxInclusiveAmount", "0.00"), d("DifferenceTaxExclusiveAmount", c(w)), d("DifferenceTaxInclusiveAmount", c(E)), d("PayableRoundingAmount", c(g.zaokrouhleni)), d("PaidDepositsAmount", "0.00"), d("PayableAmount", c(D))) + i("PaymentMeans", k) + "</Invoice>\n";
}
async function _(t, n, r, i) {
	let a = p(t, r, i);
	if (a.length === 1) {
		let e = await g(a[0], n);
		return {
			nazev: `${a[0].f.cislo}.isdoc`,
			obsah: new Blob([e], { type: "application/xml" })
		};
	}
	let { default: o } = await import("./jszip.min-Dw-Oh1vc.js").then((t) => /* @__PURE__ */ e(t.default, 1)), s = new o();
	for (let e of a) s.file(`${e.f.cislo}.isdoc`, await g(e, n));
	return {
		nazev: `ISDOC_faktury_${r}_${i}.zip`,
		obsah: await s.generateAsync({ type: "blob" })
	};
}
export { _ as isdocBalik };
