"use client";

import type Handsontable from "handsontable";
import { FunctionSquare } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { formatCellAddress } from "@/lib/excel-editor/cell-address";
import { getFormulaBarValue } from "@/lib/excel-editor/cell-value";
import { safeAddHook, safeRemoveHook } from "@/lib/excel-editor/handsontable-hooks";

type ExcelEditorFormulaBarProps = {
  hotRef: React.RefObject<Handsontable.Core | null>;
  sheetKey: string;
};

export function ExcelEditorFormulaBar({ hotRef, sheetKey }: ExcelEditorFormulaBarProps) {
  const [address, setAddress] = useState("A1");
  const [draft, setDraft] = useState("");
  const editingRef = useRef(false);

  const syncFromSelection = useCallback(() => {
    const hot = hotRef.current;
    if (!hot || editingRef.current) return;

    const sel = hot.getSelectedLast();
    if (!sel) return;
    const row = sel[0];
    const col = sel[1];
    if (row === undefined || col === undefined || row < 0 || col < 0) return;

    setAddress(formatCellAddress(col, row));
    setDraft(getFormulaBarValue(hot, row, col));
  }, [hotRef]);

  useEffect(() => {
    const hot = hotRef.current;
    if (!hot) return;

    syncFromSelection();
    safeAddHook(hot, "afterSelection", syncFromSelection);
    safeAddHook(hot, "afterSelectionEnd", syncFromSelection);
    safeAddHook(hot, "afterChange", syncFromSelection);

    return () => {
      safeRemoveHook(hot, "afterSelection", syncFromSelection);
      safeRemoveHook(hot, "afterSelectionEnd", syncFromSelection);
      safeRemoveHook(hot, "afterChange", syncFromSelection);
    };
  }, [hotRef, sheetKey, syncFromSelection]);

  const commit = () => {
    const hot = hotRef.current;
    if (!hot) return;

    const sel = hot.getSelectedLast();
    if (!sel) return;
    const row = sel[0];
    const col = sel[1];
    if (row === undefined || col === undefined || row < 0 || col < 0) return;

    hot.setDataAtCell(row, col, draft);
    hot.render();
    editingRef.current = false;
    syncFromSelection();
  };

  return (
    <div className="flex shrink-0 items-stretch gap-2 border-b border-border bg-muted/40 px-2 py-1.5 sm:px-3">
      <span className="flex w-12 shrink-0 items-center justify-center rounded-md border border-border bg-card text-xs font-bold tabular-nums text-foreground sm:w-14">
        {address}
      </span>
      <span className="flex shrink-0 items-center text-muted-foreground" title="Formula / value">
        <FunctionSquare className="h-4 w-4" aria-hidden />
      </span>
      <input
        type="text"
        value={draft}
        onChange={(e) => {
          editingRef.current = true;
          setDraft(e.target.value);
        }}
        onFocus={() => {
          editingRef.current = true;
        }}
        onBlur={() => {
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
            const hot = hotRef.current;
            const sel = hot?.getSelectedLast();
            if (hot && sel && sel[0] !== undefined && sel[1] !== undefined) {
              hot.selectCell(sel[0], sel[1]);
            }
          }
          if (e.key === "Escape") {
            editingRef.current = false;
            syncFromSelection();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="min-w-0 flex-1 rounded-md border border-border bg-card px-3 py-1.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Enter value or formula (e.g. =SUM(A1:A5))"
        aria-label="Cell editor formula bar"
        spellCheck={false}
      />
    </div>
  );
}
