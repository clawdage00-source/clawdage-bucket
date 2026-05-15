"use client";

import Handsontable from "handsontable";
import { getEditor } from "handsontable/editors/registry";
import { TextEditor } from "handsontable/editors/textEditor";
import { registerAllModules } from "handsontable/registry";
import { useEffect, useRef } from "react";

import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";
import "handsontable/styles/ht-icons-main.css";
import "./excel-editor-handsontable.css";

registerAllModules();

const DEFAULT_TEXT_EDITOR = getEditor("text");

export type ExcelEditorGridProps = {
  /** Change when a new workbook is loaded so the grid is recreated once. */
  sheetKey: string;
  data: (string | number)[][];
  headers: string[];
  onReady: (hot: Handsontable.Core) => void;
  onDestroy: () => void;
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

/** Handsontable v17: cell meta `editor` must be false, a string alias, or an editor class — never boolean. */
function normalizeCellEditor(
  _row: number,
  _col: number,
  cellProperties: Handsontable.CellMeta,
) {
  if (isValidEditorValue(cellProperties.editor)) return;
  cellProperties.editor = TextEditor;
}

function buildColumns(colCount: number): Handsontable.GridSettings["columns"] {
  return Array.from({ length: colCount }, (_, data) => ({
    data,
    type: "text",
    editor: TextEditor,
    readOnly: false,
  }));
}

/** Guard against any invalid editor resolved from inherited/plugin meta (e.g. boolean `true`). */
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

export function ExcelEditorGrid({ sheetKey, data, headers, onReady, onDestroy }: ExcelEditorGridProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const hotRef = useRef<Handsontable.Core | null>(null);
  const onReadyRef = useRef(onReady);
  const onDestroyRef = useRef(onDestroy);

  onReadyRef.current = onReady;
  onDestroyRef.current = onDestroy;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const { width, height } = measureHost(host);

    const hot = new Handsontable(host, {
      licenseKey: "non-commercial-and-evaluation",
      data,
      colHeaders: headers,
      columns: buildColumns(headers.length),
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
      contextMenu: true,
      columnSorting: true,
      renderAllRows: false,
      viewportRowRenderingOffset: 30,
      viewportColumnRenderingOffset: 10,
      cells: () => ({
        type: "text",
        editor: TextEditor,
        readOnly: false,
      }),
      beforeGetCellMeta: normalizeCellEditor,
      afterGetCellMeta: normalizeCellEditor,
    });

    patchGetCellEditor(hot);

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
      hot.destroy();
      hotRef.current = null;
      onDestroyRef.current();
    };
    // Recreate only when user loads a different sheet
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sheetKey gates full rebuild
  }, [sheetKey]);

  return <div ref={hostRef} className="excel-editor-hot ht-theme-main h-full w-full min-h-0" />;
}
