import { CellFormatStore } from "@/lib/excel-editor/cell-format-store";
import type { CellFormat, ConditionalRule } from "@/lib/excel-editor/format-types";
import type { NamedRange } from "@/lib/excel-editor/named-ranges-store";
import type { ColumnValidation } from "@/lib/excel-editor/validation-store";

const STORAGE_KEY = "clawdage:excel-editor-session";
const SESSION_VERSION = 2;

export type ExcelEditorSession = {
  version: typeof SESSION_VERSION;
  sheetKey: string;
  headers: string[];
  fileData: (string | number)[][];
  headerRowChoice: number;
  originalFileName: string;
  fileSize: number;
  formats: {
    cells: Record<string, CellFormat>;
    rules: ConditionalRule[];
  };
  columnValidations?: Record<string, ColumnValidation>;
  namedRanges?: NamedRange[];
  updatedAt: number;
};

export function loadExcelEditorSession(): ExcelEditorSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ExcelEditorSession;
    if (parsed.version !== SESSION_VERSION && parsed.version !== 1) return null;
    if (!parsed.sheetKey || !Array.isArray(parsed.headers)) return null;
    if (!Array.isArray(parsed.fileData)) return null;

    return {
      ...parsed,
      headers: parsed.headers.map(String),
      fileData: parsed.fileData.map((row) =>
        Array.isArray(row) ? row.map((c) => (c === null || c === undefined ? "" : c)) : [],
      ),
      formats: parsed.formats ?? { cells: {}, rules: [] },
      columnValidations: parsed.columnValidations,
      namedRanges: parsed.namedRanges,
    };
  } catch {
    return null;
  }
}

export function saveExcelEditorSession(session: Omit<ExcelEditorSession, "version" | "updatedAt">): boolean {
  if (typeof window === "undefined") return false;

  const payload: ExcelEditorSession = {
    ...session,
    version: SESSION_VERSION,
    updatedAt: Date.now(),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function clearExcelEditorSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function restoreFormatStore(
  data: ExcelEditorSession["formats"] | undefined,
): CellFormatStore {
  return CellFormatStore.importState(data ?? { cells: {}, rules: [] });
}
