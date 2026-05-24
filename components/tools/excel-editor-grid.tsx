"use client";

import Handsontable from "handsontable";
import type { MenuConfig } from "handsontable/plugins/contextMenu";
import { getEditor } from "handsontable/editors/registry";
import { TextEditor } from "handsontable/editors/textEditor";
import { registerAllModules } from "handsontable/registry";
import { HyperFormula } from "hyperformula";
import { useEffect, useRef } from "react";

import type { CellFormatStore } from "@/lib/excel-editor/cell-format-store";
import type { ValidationStore } from "@/lib/excel-editor/validation-store";
import { applyConditionalFormatting } from "@/lib/excel-editor/conditional-format";
import { inferCellMeta } from "@/lib/excel-editor/cell-meta";
import { buildFormatCellMeta } from "@/lib/excel-editor/format-meta";
import "@/lib/excel-editor/formatted-renderer";
import { safeAddHook, safeRemoveHook } from "@/lib/excel-editor/handsontable-hooks";

import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";
import "handsontable/styles/ht-icons-main.css";
import "./excel-editor-handsontable.css";

registerAllModules();

const DEFAULT_TEXT_EDITOR = getEditor("text");

export type ExcelEditorGridProps = {
  sheetKey: string;
  data: (string | number)[][];
  headers: string[];
  formatStoreRef: React.RefObject<CellFormatStore | null>;
  validationStoreRef?: React.RefObject<ValidationStore | null>;
  validationEpoch?: number;
  onReady: (hot: Handsontable.Core) => void;
  onDestroy: () => void;
  onSetHeaderFromRow?: (bodyRowIndex: number) => void;
  /** Fired after cell data changes (debounced persist in parent). */
  onSheetChange?: () => void;
};

function measureHost(host: HTMLElement) {
  const rect = host.getBoundingClientRect();
  return {
    width: Math.max(320, Math.floor(rect.width)),
    height: Math.max(240, Math.floor(rect.height)),
  };
}

function isValidEditorValue(
  editor: unknown,
): editor is string | typeof TextEditor | false {
  return editor === false || typeof editor === "string" || typeof editor === "function";
}

function normalizeCellEditor(
  _row: number,
  _col: number,
  cellProperties: Handsontable.CellMeta,
) {
  if (isValidEditorValue(cellProperties.editor)) return;
  cellProperties.editor = TextEditor;
}

export function buildExcelColumns(colCount: number): Handsontable.GridSettings["columns"] {
  return Array.from({ length: colCount }, (_, data) => ({
    data,
    type: "text",
    editor: TextEditor,
    readOnly: false,
  }));
}

function patchGetCellEditor(hot: Handsontable.Core) {
  const original = hot.getCellEditor.bind(hot);
  hot.getCellEditor = ((rowOrMeta: number | Handsontable.CellMeta, column?: number) => {
    const resolved: unknown =
      typeof rowOrMeta === "number"
        ? original(rowOrMeta, column as number)
        : original(rowOrMeta);
    if (resolved === false) return false as never;
    if (typeof resolved === "string" || typeof resolved === "function") return resolved as never;
    return DEFAULT_TEXT_EDITOR as never;
  }) as unknown as typeof hot.getCellEditor;
}

function pasteWithMode(hot: Handsontable.Core, mode: "overwrite" | "shift_down" | "shift_right") {
  const cp = hot.getPlugin("copyPaste");
  const prev = cp.pasteMode;
  cp.pasteMode = mode;
  cp.paste();
  cp.pasteMode = prev;
}

function buildContextMenu(
  onSetHeaderFromRow?: (bodyRowIndex: number) => void,
): Handsontable.GridSettings["contextMenu"] {
  const base: MenuConfig = {
    undo: {},
    redo: {},
    sp_undo: { name: "---------" },
    row_above: {},
    row_below: {},
    remove_row: { name: "Delete row(s)" },
    ...(onSetHeaderFromRow
      ? {
          sp_header: { name: "---------" },
          set_header_row: {
            name: "Use selected row as header",
            callback(this: Handsontable.Core) {
              const range = this.getSelectedRangeActive();
              if (!range || range.from.row < 0) return;
              onSetHeaderFromRow(range.from.row);
            },
            disabled(this: Handsontable.Core) {
              const range = this.getSelectedRangeActive();
              return !range || range.from.row < 0;
            },
          },
        }
      : {}),
    sp_fmt: { name: "---------" },
    alignment: {},
    mergeCells: {},
    sp_clip: { name: "---------" },
    copy: {},
    cut: {},
    paste: {
      name: "Paste",
      callback(this: Handsontable.Core) {
        this.getPlugin("copyPaste").paste();
      },
    },
    paste_shift_down: {
      name: "Paste — shift cells down",
      callback(this: Handsontable.Core) {
        pasteWithMode(this, "shift_down");
      },
    },
    paste_shift_right: {
      name: "Paste — shift cells right",
      callback(this: Handsontable.Core) {
        pasteWithMode(this, "shift_right");
      },
    },
  };

  return { items: base };
}

export function ExcelEditorGrid({
  sheetKey,
  data,
  headers,
  formatStoreRef,
  validationStoreRef,
  validationEpoch = 0,
  onReady,
  onDestroy,
  onSetHeaderFromRow,
  onSheetChange,
}: ExcelEditorGridProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const hotRef = useRef<Handsontable.Core | null>(null);
  const onReadyRef = useRef(onReady);
  const onDestroyRef = useRef(onDestroy);
  const onSetHeaderFromRowRef = useRef(onSetHeaderFromRow);
  const onSheetChangeRef = useRef(onSheetChange);
  const dataRef = useRef(data);

  onReadyRef.current = onReady;
  onDestroyRef.current = onDestroy;
  onSetHeaderFromRowRef.current = onSetHeaderFromRow;
  onSheetChangeRef.current = onSheetChange;
  dataRef.current = data;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const { width, height } = measureHost(host);
    const formulaSheetName = `sheet_${sheetKey.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 48)}`;

    const onAfterChange = () => {
      const store = formatStoreRef.current;
      const hotInstance = hotRef.current;
      if (store && hotInstance && store.getRules().length) {
        applyConditionalFormatting(hotInstance, store);
      }
      onSheetChangeRef.current?.();
    };

    const hot = new Handsontable(host, {
      licenseKey: "non-commercial-and-evaluation",
      data,
      colHeaders: headers,
      columns: buildExcelColumns(headers.length),
      rowHeaders: true,
      width,
      height,
      stretchH: "all",
      type: "text",
      editor: TextEditor,
      readOnly: false,
      enterBeginsEditing: true,
      tabNavigation: true,
      outsideClickDeselects: false,
      manualColumnResize: true,
      manualRowResize: true,
      allowInsertRow: true,
      allowRemoveRow: true,
      undo: true,
      copyPaste: true,
      mergeCells: true,
      customBorders: true,
      fillHandle: {
        autoInsertRow: true,
        direction: "vertical",
      },
      formulas: {
        engine: HyperFormula,
        sheetName: formulaSheetName,
      },
      search: {
        searchResultClass: "htSearchResult",
      },
      contextMenu: buildContextMenu(onSetHeaderFromRowRef.current),
      columnSorting: true,
      filters: true,
      dropdownMenu: {
        items: {
          filter_by_condition: {},
          filter_by_value: {},
          filter_action_bar: {},
        },
      },
      renderAllRows: false,
      viewportRowRenderingOffset: 30,
      viewportColumnRenderingOffset: 10,
      cells(row, col) {
        const val = dataRef.current[row]?.[col];
        const store = formatStoreRef.current;
        const validation = validationStoreRef?.current?.get(col);

        let base: Handsontable.CellMeta = { editor: TextEditor, readOnly: false };

        if (validation?.type === "list" && validation.allowed.length > 0) {
          base = {
            ...base,
            type: "dropdown",
            source: [...validation.allowed],
            strict: validation.strict ?? false,
            allowInvalid: true,
          };
        } else if (validation?.type === "number") {
          base = {
            ...base,
            type: "numeric",
            allowInvalid: true,
          };
        }

        if (store) {
          const fmt = store.get(row, col);
          const hasFormat = Object.keys(fmt).length > 0;
          if (hasFormat) {
            return {
              ...base,
              ...buildFormatCellMeta(row, col, val, fmt),
              editor: TextEditor,
              readOnly: false,
            };
          }
        }
        const inferred = inferCellMeta(val);
        return {
          ...base,
          ...inferred,
          editor: TextEditor,
          readOnly: false,
        };
      },
      beforeGetCellMeta: normalizeCellEditor,
      afterGetCellMeta: normalizeCellEditor,
    });

    patchGetCellEditor(hot);
    safeAddHook(hot, "afterChange", onAfterChange);

    hotRef.current = hot;
    onReadyRef.current(hot);

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const applySize = () => {
      const next = measureHost(host);
      const settings = hot.getSettings();
      if (settings.width === next.width && settings.height === next.height) return;
      hot.updateSettings({ width: next.width, height: next.height });
    };

    const scheduleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applySize, 150);
    };

    window.addEventListener("resize", scheduleResize);
    const ro = new ResizeObserver(scheduleResize);
    ro.observe(host);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", scheduleResize);
      ro.disconnect();
      safeRemoveHook(hot, "afterChange", onAfterChange);
      onDestroyRef.current();
      hot.destroy();
      hotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sheetKey gates full rebuild
  }, [sheetKey]);

  useEffect(() => {
    hotRef.current?.render();
  }, [validationEpoch]);

  return <div ref={hostRef} className="excel-editor-hot ht-theme-main h-full w-full min-h-0" />;
}
