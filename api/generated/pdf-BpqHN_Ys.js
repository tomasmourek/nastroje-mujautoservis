import { r as e } from "./rolldown-runtime-DfEuXgQw.js";
import { a as t, o as n, t as r } from "./sestavy-Cc-ls0Oa.js";
// src/lib/export/pdf.ts
var i = "#ededed", a = "#9a9a9a";
async function o() {
	let [{ default: t }, { default: n }] = await Promise.all([import("./pdfmake-DAOUpfZr.js").then((t) => /* @__PURE__ */ e(t.default, 1)), import("./vfs_fonts-BN-PaKhO.js").then((t) => /* @__PURE__ */ e(t.default, 1))]);
	return t.addVirtualFileSystem(n), t;
}
function s(e, o, s) {
	let c = e.orientace === "landscape" ? 786 : 539, l = [];
	if (l.push({
		stack: [
			{
				text: o.nazev,
				bold: !0,
				fontSize: 10
			},
			{
				text: `${o.ulice} ${o.cisloPopisne}`.trim(),
				fontSize: 9
			},
			{
				text: `${o.psc}  ${o.obec}`.trim(),
				fontSize: 9
			},
			o.ico || o.dic ? {
				text: [o.ico && `IČO ${o.ico}`, o.dic && `DIČ ${o.dic}`].filter(Boolean).join("   "),
				fontSize: 8,
				color: "#444"
			} : ""
		],
		margin: [
			0,
			0,
			0,
			10
		],
		pageBreak: s ? void 0 : "before",
		pageOrientation: e.orientace
	}), l.push({
		text: `${e.nazev},  ${e.obdobi}`,
		fontSize: 15,
		margin: [
			0,
			0,
			0,
			2
		]
	}), e.popis && l.push({
		text: e.popis,
		fontSize: 7.5,
		italics: !0,
		color: "#444",
		margin: [
			0,
			0,
			0,
			6
		]
	}), e.chybiData) return l.push({
		text: `Nelze sestavit: ${e.chybiData}`,
		bold: !0,
		color: "#b00020",
		margin: [
			0,
			10,
			0,
			0
		]
	}), l;
	for (let r of e.tabulky) {
		r.nadpis && l.push({
			text: r.nadpis,
			bold: !0,
			fontSize: 10,
			margin: [
				0,
				8,
				0,
				3
			]
		});
		let e = r.sloupce.map((e) => e.sirka ?? 1), o = e.reduce((e, t) => e + t, 0), s = e.map((e) => Math.floor((c - r.sloupce.length * 6) * e / o)), u = r.sloupce.length > 10 ? 6.5 : 7.5, d = r.sloupce.map((e) => ({
			text: e.nazev,
			bold: !0,
			fontSize: u,
			alignment: t(e.typ) ? "right" : "left"
		})), f = r.radky.map((e) => r.sloupce.map((r) => ({
			text: n(e.h[r.klic], r.typ),
			fontSize: u,
			bold: !!e.druh,
			fillColor: e.druh ? i : void 0,
			alignment: t(r.typ) ? "right" : "left",
			noWrap: t(r.typ)
		})));
		f.length || f.push([{
			text: "Žádné záznamy",
			italics: !0,
			fontSize: u,
			colSpan: r.sloupce.length
		}, ...r.sloupce.slice(1).map(() => ({ text: "" }))]), l.push({
			table: {
				headerRows: 1,
				widths: s,
				body: [d, ...f],
				dontBreakRows: !0
			},
			layout: {
				hLineWidth: (e, t) => e === 0 || e === 1 || e === t.table.body.length ? .8 : 0,
				vLineWidth: () => 0,
				hLineColor: () => a,
				paddingTop: () => 1.5,
				paddingBottom: () => 1.5,
				paddingLeft: () => 3,
				paddingRight: () => 3
			}
		});
	}
	let u = e.souhrny.filter((e) => e.polozky.length).map((e) => ({
		width: "auto",
		stack: [e.nadpis ? {
			text: e.nadpis,
			bold: !0,
			fontSize: 8.5,
			margin: [
				0,
				0,
				0,
				2
			]
		} : "", {
			table: {
				widths: [150, 80],
				body: e.polozky.map((e) => [{
					text: e.nazev,
					fontSize: 8.5,
					bold: !!e.zvyraznit
				}, {
					text: n(e.hodnota, e.typ),
					fontSize: 8.5,
					bold: !!e.zvyraznit,
					alignment: "right"
				}])
			},
			layout: {
				hLineWidth: (e, t) => e === 0 || e === t.table.body.length ? 0 : .4,
				vLineWidth: () => 0,
				hLineColor: () => a
			}
		}]
	}));
	u.length && l.push({
		columns: u,
		columnGap: 24,
		margin: [
			0,
			12,
			0,
			0
		]
	});
	let d = e.nalezy?.length ? [...e.upozorneni, `${r(e.nalezy.length)}. Seznam dokladů je v aplikaci a v balíku sestav v Excelu.`] : e.upozorneni;
	return d.length && l.push({
		margin: [
			0,
			10,
			0,
			0
		],
		stack: [{
			text: "Upozornění",
			bold: !0,
			fontSize: 8,
			color: "#8a5a00"
		}, { ul: d.map((e) => ({
			text: e,
			fontSize: 7.5
		})) }]
	}), l;
}
async function c(e, t) {
	let n = await o(), r = /* @__PURE__ */ new Date(), i = `${r.toLocaleDateString("cs-CZ")} ${r.toLocaleTimeString("cs-CZ", {
		hour: "2-digit",
		minute: "2-digit"
	})}`, a = e.map((e) => e.kod), c = {
		pageSize: "A4",
		pageOrientation: e[0]?.orientace ?? "landscape",
		pageMargins: [
			28,
			28,
			28,
			40
		],
		info: {
			title: e.map((e) => e.nazev).join(", "),
			author: t.sestavil || t.nazev
		},
		defaultStyle: {
			font: "Roboto",
			fontSize: 8
		},
		content: e.flatMap((e, n) => s(e, t, n === 0)),
		footer: (e, n) => ({
			margin: [
				28,
				10,
				28,
				0
			],
			fontSize: 7,
			color: "#444",
			columns: [
				{
					text: t.sestavil ? `Vytiskl(a): ${t.sestavil}` : "",
					width: "*"
				},
				{
					text: `Sestava ${a.length === 1 ? a[0] : "balík"}  ·  Strana ${e} z ${n}`,
					alignment: "center",
					width: "*"
				},
				{
					text: `Datum: ${i}`,
					alignment: "right",
					width: "*"
				}
			]
		})
	};
	return n.createPdf(c).getBlob();
}
export { c as sestavyDoPdf };
