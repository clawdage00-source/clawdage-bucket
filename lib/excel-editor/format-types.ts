export type HorizontalAlign = "left" | "center" | "right";
export type VerticalAlign = "top" | "middle" | "bottom";

export type NumberFormatKind =
  | "general"
  | "number"
  | "currency"
  | "percent"
  | "date";

export type CellFormat = {
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: HorizontalAlign;
  valign?: VerticalAlign;
  wrap?: boolean;
  /** Degrees: 0, 45, 90, -45 */
  rotation?: number;
  bgColor?: string;
  numberFormat?: NumberFormatKind;
};

export type ConditionalOperator = "gt" | "lt" | "eq" | "gte" | "lte" | "contains" | "between";

export type ConditionalRule = {
  id: string;
  operator: ConditionalOperator;
  value: string;
  value2?: string;
  format: Pick<CellFormat, "bgColor" | "fontColor" | "bold">;
};

export const DEFAULT_CELL_FORMAT: CellFormat = {};

export function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}
