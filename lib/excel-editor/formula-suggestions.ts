/** Built-in functions supported via HyperFormula in the grid. */
export const FORMULA_FUNCTIONS = [
  "SUM",
  "AVERAGE",
  "IF",
  "VLOOKUP",
  "XLOOKUP",
  "COUNTIF",
  "COUNT",
  "COUNTA",
  "MIN",
  "MAX",
  "ROUND",
  "ABS",
  "AND",
  "OR",
  "NOT",
  "CONCATENATE",
  "LEFT",
  "RIGHT",
  "MID",
  "LEN",
  "TRIM",
  "UPPER",
  "LOWER",
  "TODAY",
  "NOW",
  "DATE",
  "YEAR",
  "MONTH",
  "DAY",
] as const;

export function buildFormulaSuggestions(draft: string, namedRanges: string[]): string[] {
  const trimmed = draft.trimStart();
  if (!trimmed.startsWith("=")) return [];

  const tail = trimmed.slice(1);
  const fnMatch = tail.match(/([A-Za-z_]*)$/);
  const prefix = fnMatch?.[1]?.toUpperCase() ?? "";

  const fnSuggestions = FORMULA_FUNCTIONS.filter((fn) =>
    fn.startsWith(prefix),
  ).map((fn) => `=${fn}(`);

  const rangeSuggestions = namedRanges
    .filter((name) => name.toUpperCase().startsWith(prefix) || prefix === "")
    .map((name) => `=${name}`);

  return [...new Set([...fnSuggestions, ...rangeSuggestions])].slice(0, 24);
}
