"use client";

import type Handsontable from "handsontable";
import {
  ClipboardPaste,
  Copy,
  Redo2,
  Scissors,
  Search,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { safeAddHook, safeRemoveHook } from "@/lib/excel-editor/handsontable-hooks";

type ExcelEditorRibbonProps = {
  hotRef: React.RefObject<Handsontable.Core | null>;
  sheetKey: string;
  onOpenFindReplace: () => void;
};

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border bg-card px-2 text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function ExcelEditorRibbon({ hotRef, sheetKey, onOpenFindReplace }: ExcelEditorRibbonProps) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const refreshUndoState = useCallback(() => {
    const hot = hotRef.current;
    if (!hot) return;
    const undoRedo = hot.getPlugin("undoRedo");
    setCanUndo(undoRedo.isUndoAvailable());
    setCanRedo(undoRedo.isRedoAvailable());
  }, [hotRef]);

  useEffect(() => {
    const hot = hotRef.current;
    if (!hot) return;

    refreshUndoState();
    const onChange = () => refreshUndoState();
    safeAddHook(hot, "afterChange", onChange);
    safeAddHook(hot, "afterUndo", onChange);
    safeAddHook(hot, "afterRedo", onChange);

    return () => {
      safeRemoveHook(hot, "afterChange", onChange);
      safeRemoveHook(hot, "afterUndo", onChange);
      safeRemoveHook(hot, "afterRedo", onChange);
    };
  }, [hotRef, sheetKey, refreshUndoState]);

  const withHot = (fn: (hot: Handsontable.Core) => void) => {
    const hot = hotRef.current;
    if (hot) fn(hot);
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border bg-card px-2 py-1.5 sm:gap-2 sm:px-3">
      <div className="flex items-center gap-1">
        <ToolbarButton
          label="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={() => withHot((hot) => hot.getPlugin("undoRedo").undo())}
        >
          <Undo2 className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Redo (Ctrl+Y)"
          disabled={!canRedo}
          onClick={() => withHot((hot) => hot.getPlugin("undoRedo").redo())}
        >
          <Redo2 className="h-4 w-4" aria-hidden />
        </ToolbarButton>
      </div>

      <span className="hidden h-6 w-px bg-border sm:block" aria-hidden />

      <div className="flex items-center gap-1">
        <ToolbarButton label="Copy (Ctrl+C)" onClick={() => withHot((hot) => hot.getPlugin("copyPaste").copy())}>
          <Copy className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Cut (Ctrl+X)" onClick={() => withHot((hot) => hot.getPlugin("copyPaste").cut())}>
          <Scissors className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Paste (Ctrl+V)"
          onClick={() => withHot((hot) => hot.getPlugin("copyPaste").paste())}
        >
          <ClipboardPaste className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <select
          className="inline-flex h-9 max-w-[8.5rem] cursor-pointer items-center rounded-lg border border-border bg-card px-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          defaultValue=""
          aria-label="Paste special"
          onChange={(e) => {
            const mode = e.target.value as "" | "overwrite" | "shift_down" | "shift_right";
            if (!mode) return;
            withHot((hot) => {
              const cp = hot.getPlugin("copyPaste");
              const prev = cp.pasteMode;
              cp.pasteMode = mode;
              cp.paste();
              cp.pasteMode = prev;
            });
            e.target.value = "";
          }}
        >
          <option value="">Paste special</option>
          <option value="overwrite">Overwrite</option>
          <option value="shift_down">Shift cells down</option>
          <option value="shift_right">Shift cells right</option>
        </select>
      </div>

      <span className="hidden h-6 w-px bg-border sm:block" aria-hidden />

      <ToolbarButton label="Find and replace (Ctrl+F)" onClick={onOpenFindReplace}>
        <Search className="h-4 w-4" aria-hidden />
      </ToolbarButton>

      <p className="ml-auto hidden text-[10px] text-muted-foreground lg:block">
        Drag the fill handle on a cell corner to AutoFill · Double-click to edit
      </p>
    </div>
  );
}
