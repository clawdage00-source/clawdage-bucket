"use client";

import type Handsontable from "handsontable";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { findMatches, replaceAllInSheet } from "@/lib/excel-editor/find-replace";

type ExcelEditorFindReplaceProps = {
  open: boolean;
  onClose: () => void;
  hotRef: React.RefObject<Handsontable.Core | null>;
  onToast: (message: string) => void;
};

export function ExcelEditorFindReplace({ open, onClose, hotRef, onToast }: ExcelEditorFindReplaceProps) {
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeCell, setWholeCell] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [matchIndex, setMatchIndex] = useState(0);
  const [matches, setMatches] = useState<Array<{ row: number; col: number }>>([]);

  const runFind = useCallback(() => {
    const hot = hotRef.current;
    if (!hot || !find.trim()) {
      setMatches([]);
      setMatchCount(0);
      setMatchIndex(0);
      return;
    }
    const results = findMatches(hot, find, caseSensitive);
    setMatches(results.map((r) => ({ row: r.row, col: r.col })));
    setMatchCount(results.length);
    setMatchIndex(0);
    const first = results[0];
    if (first) {
      hot.selectCell(first.row, first.col);
      hot.scrollViewportTo(first.row, first.col);
    }
    hot.render();
  }, [hotRef, find, caseSensitive]);

  useEffect(() => {
    if (!open) return;
    runFind();
  }, [open, find, caseSensitive, runFind]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const focusMatch = (index: number) => {
    const hot = hotRef.current;
    if (!hot || matches.length === 0) return;
    const i = ((index % matches.length) + matches.length) % matches.length;
    setMatchIndex(i);
    const m = matches[i]!;
    hot.selectCell(m.row, m.col);
    hot.scrollViewportTo(m.row, m.col);
  };

  const handleReplaceAll = () => {
    const hot = hotRef.current;
    if (!hot || !find.trim()) return;
    const count = replaceAllInSheet(hot, { find, replace, caseSensitive, wholeCell });
    onToast(count === 0 ? "No matches replaced." : `Replaced ${count} cell(s).`);
    runFind();
  };

  if (!open) return null;

  return (
    <div
      className="absolute right-2 top-2 z-20 w-[min(100%,22rem)] rounded-xl border border-border bg-card p-4 shadow-lg sm:right-4"
      role="dialog"
      aria-label="Find and replace"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-foreground">Find &amp; replace</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-medium text-foreground">
          Find
          <input
            type="text"
            value={find}
            onChange={(e) => setFind(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
        </label>
        <label className="block text-xs font-medium text-foreground">
          Replace with
          <input
            type="text"
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <div className="flex flex-wrap gap-3 text-xs text-foreground">
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              className="rounded border-border"
            />
            Match case
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={wholeCell}
              onChange={(e) => setWholeCell(e.target.checked)}
              className="rounded border-border"
            />
            Whole cell
          </label>
        </div>

        <p className="text-xs text-muted-foreground">
          {matchCount === 0 ? "No matches" : `${matchIndex + 1} of ${matchCount} matches`}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => focusMatch(matchIndex - 1)}
            disabled={matchCount === 0}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => focusMatch(matchIndex + 1)}
            disabled={matchCount === 0}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted disabled:opacity-40"
          >
            Next
          </button>
          <button
            type="button"
            onClick={handleReplaceAll}
            disabled={!find.trim()}
            className="ml-auto rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            Replace all
          </button>
        </div>
      </div>
    </div>
  );
}
