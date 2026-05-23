import type Handsontable from "handsontable";

/** Value shown in the formula bar (formula string when applicable). */
export function getFormulaBarValue(hot: Handsontable.Core, row: number, col: number): string {
  const formulas = hot.getPlugin("formulas");
  if (formulas.isEnabled() && formulas.isFormulaCellType(row, col)) {
    const engine = formulas.engine;
    const sheetId = formulas.sheetId;
    if (engine && sheetId !== null) {
      const content = engine.getCellSerialized({ sheet: sheetId, row, col });
      if (content !== null && content !== undefined) return String(content);
    }
  }
  const raw = hot.getDataAtCell(row, col);
  return raw === null || raw === undefined ? "" : String(raw);
}
