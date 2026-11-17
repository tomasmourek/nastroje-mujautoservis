import { r as e } from "./rolldown-runtime-DfEuXgQw.js";
import { n as t } from "./nastaveni-DdJkITgT.js";
// src/lib/export/excel.ts
var n = {
	kc: "#,##0.00;[Red]-#,##0.00",
	cislo: "#,##0",
	hodiny: "#,##0.00",
	procento: "0.00 %",
	datum: "dd.mm.yyyy"
};
function r(e, t) {
	if (e == null || e === "") return null;
	if (t === "datum" && typeof e == "string") {
		let t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e);
		return t ? new Date(Date.UTC(+t[1], t[2] - 1, +t[3])) : e;
	}
	return e;
}
function i(e, t) {
	let n = e.replace(/[\\/?*[\]:]/g, " ").slice(0, 31).trim();
	for (let r = 2; t.has(n); r++) n = `${e.slice(0, 27)} ${r}`;
	return t.add(n), n;
}
async function a(a, o) {
	let { default: s } = await import("./exceljs.min-DQwryIY4.js").then((t) => /* @__PURE__ */ e(t.default, 1)), c = new s.Workbook();
	c.creator = o.nazev, c.created = /* @__PURE__ */ new Date();
	let l = /* @__PURE__ */ new Set(), u = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFEDEDED" }
	}, d = {
		style: "thin",
		color: { argb: "FF9A9A9A" }
	};
	for (let e of a) {
		let a = c.addWorksheet(i(e.nazev, l), {
			pageSetup: {
				paperSize: 9,
				orientation: e.orientace,
				fitToPage: !0,
				fitToWidth: 1,
				fitToHeight: 0,
				margins: {
					left: .4,
					right: .4,
					top: .5,
					bottom: .5,
					header: .3,
					footer: .3
				}
			},
			headerFooter: { oddFooter: `&L${e.kod}&CStrana &P z &N&RVytištěno &D` }
		}), s = Math.max(...e.tabulky.map((e) => e.sloupce.length), 4);
		if (a.addRow([o.nazev]).font = {
			bold: !0,
			size: 11
		}, a.addRow([t(o)]), (o.ico || o.dic) && a.addRow([[o.ico && `IČO ${o.ico}`, o.dic && `DIČ ${o.dic}`].filter(Boolean).join("   ")]), a.addRow([]), a.addRow([`${e.nazev}, ${e.obdobi}`]).font = {
			bold: !0,
			size: 14
		}, e.popis && (a.addRow([e.popis]).font = {
			italic: !0,
			size: 9,
			color: { argb: "FF555555" }
		}), e.chybiData) {
			a.addRow([]), a.addRow([`Nelze sestavit: ${e.chybiData}`]).font = {
				bold: !0,
				color: { argb: "FFB00020" }
			};
			continue;
		}
		for (let t of e.tabulky) {
			a.addRow([]), t.nadpis && (a.addRow([t.nadpis]).font = {
				bold: !0,
				size: 11
			});
			let e = a.addRow(t.sloupce.map((e) => e.nazev));
			e.font = {
				bold: !0,
				size: 9
			}, e.alignment = {
				wrapText: !0,
				vertical: "middle",
				horizontal: "center"
			}, e.height = 30, e.eachCell((e) => {
				e.border = {
					top: d,
					bottom: d
				}, e.fill = u;
			}), a.views.length || (a.views = [{
				state: "frozen",
				ySplit: e.number
			}]);
			for (let e of t.radky) {
				let i = a.addRow(t.sloupce.map((t) => r(e.h[t.klic] ?? null, t.typ)));
				t.sloupce.forEach((e, t) => {
					let r = n[e.typ];
					r && (i.getCell(t + 1).numFmt = r);
				}), e.druh && (i.font = { bold: !0 }, i.eachCell({ includeEmpty: !0 }, (t) => {
					t.fill = u, e.druh === "soucet" && (t.border = {
						top: d,
						bottom: { style: "double" }
					});
				})), e.upozorneni && (i.getCell(t.sloupce.length + 1).value = `⚠ ${e.upozorneni}`);
			}
			t.radky.length || (a.addRow(["Žádné záznamy"]).font = { italic: !0 });
		}
		for (let t of e.souhrny) {
			a.addRow([]), t.nadpis && (a.addRow([t.nadpis]).font = { bold: !0 });
			for (let e of t.polozky) {
				let t = a.addRow([
					e.nazev,
					null,
					r(e.hodnota, e.typ)
				]), i = n[e.typ];
				i && (t.getCell(3).numFmt = i), e.zvyraznit && (t.font = { bold: !0 });
			}
		}
		let f = [...e.upozorneni, ...e.nalezy ?? []];
		if (f.length) {
			a.addRow([]), a.addRow(["Upozornění"]).font = {
				bold: !0,
				color: { argb: "FF8A5A00" }
			};
			for (let e of f) a.addRow([e]).font = { size: 9 };
		}
		let p = e.tabulky[0]?.sloupce ?? [];
		for (let e = 1; e <= s + 1; e++) {
			let t = p[e - 1];
			a.getColumn(e).width = t ? Math.round(12 * (t.sirka ?? 1)) + 2 : 14;
		}
		a.getColumn(1).width = Math.max(a.getColumn(1).width ?? 10, 12);
	}
	let f = await c.xlsx.writeBuffer();
	return new Blob([f], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
export { a as sestavyDoExcelu };
