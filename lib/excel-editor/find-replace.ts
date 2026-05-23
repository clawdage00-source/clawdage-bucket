import type Handsontable from "handsontable";

export type FindReplaceOptions = {
  find: string;
  replace: string;
  caseSensitive: boolean;
  wholeCell: boolean;
};

export function findMatches(
  hot: Handsontable.Core,
  query: string,
  caseSensitive: boolean,
): Array<{ row: number; col: number; data: unknown }> {
  if (!query.trim()) return [];

  const search = hot.getPlugin("search");
  const queryMethod = (
    queryStr: string,
    value: unknown,
    cellProperties: { locale?: string },
  ) => {
    if (value === null || value === undefined) return false;
    const hay = String(value);
    const needle = queryStr;
    if (caseSensitive) return hay.includes(needle);
    return hay.toLocaleLowerCase(cellProperties.locale).includes(needle.toLocaleLowerCase(cellProperties.locale));
  };

  return search.query(query, undefined, queryMethod);
}

export function replaceAllInSheet(hot: Handsontable.Core, options: FindReplaceOptions): number {
  const { find, replace, caseSensitive, wholeCell } = options;
  if (!find) return 0;

  const rows = hot.countRows();
  const cols = hot.countCols();
  let count = 0;
  const flags = caseSensitive ? "" : "i";
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  hot.suspendRender();
  try {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = hot.getDataAtCell(r, c);
        const s = String(val ?? "");
        let next: string | null = null;

        if (wholeCell) {
          const re = new RegExp(`^${escaped}$`, flags);
          if (re.test(s)) next = replace;
        } else {
          const re = new RegExp(escaped, flags + "g");
          if (re.test(s)) {
            next = s.replace(new RegExp(escaped, flags + "g"), replace);
          }
        }

        if (next !== null && next !== s) {
          hot.setDataAtCell(r, c, next);
          count++;
        }
      }
    }
  } finally {
    hot.resumeRender();
  }

  hot.render();
  return count;
}
