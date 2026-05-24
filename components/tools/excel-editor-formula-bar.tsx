"use client";

import type Handsontable from "handsontable";
import { FunctionSquare } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { formatCellAddress } from "@/lib/excel-editor/cell-address";
import { getFormulaBarValue } from "@/lib/excel-editor/cell-value";
import { buildFormulaSuggestions } from "@/lib/excel-editor/formula-suggestions";
import { safeAddHook, safeRemoveHook } from "@/lib/excel-editor/handsontable-hooks";
import type { NamedRangesStore } from "@/lib/excel-editor/named-ranges-store";

type ExcelEditorFormulaBarProps = {
  hotRef: React.RefObject<Handsontable.Core | null>;
  namedRangesRef: React.RefObject<NamedRangesStore | null>;
  sheetKey: string;
};

export function ExcelEditorFormulaBar({
  hotRef,
  namedRangesRef,
  sheetKey,
}: ExcelEditorFormulaBarProps) {
  const listId = useId().replace(/:/g, "");
  const [address, setAddress] = useState("A1");
  const [draft, setDraft] = useState("");
  const editingRef = useRef(false);

  const namedRangeNames = useMemo(
    () => namedRangesRef.current?.list().map((r) => r.name) ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when sheet reloads
    [namedRangesRef, sheetKey],
  );

  const suggestions = useMemo(
    () => buildFormulaSuggestions(draft, namedRangeNames),
    [draft, namedRangeNames],
  );

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
        list={suggestions.length > 0 ? listId : undefined}
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
        placeholder="=SUM(A1:A5) · AVERAGE · IF · VLOOKUP · XLOOKUP · COUNTIF"
        aria-label="Cell editor formula bar"
        spellCheck={false}
      />
      {suggestions.length > 0 ? (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      ) : null}
    </div>
  );
}
