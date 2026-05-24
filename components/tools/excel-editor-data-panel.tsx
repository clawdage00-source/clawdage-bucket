"use client";

import { motion } from "framer-motion";
import type Handsontable from "handsontable";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  CopyMinus,
  Filter,
  FilterX,
  ListChecks,
  Table2,
  Tags,
} from "lucide-react";
import { useState } from "react";

import {
  clearAllFilters,
  enableStructuredTable,
  getSortColumn,
  removeDuplicateRows,
  sortByColumn,
  type SortMode,
} from "@/lib/excel-editor/data-operations";
import type { NamedRangesStore } from "@/lib/excel-editor/named-ranges-store";
import { formatRangeRef } from "@/lib/excel-editor/named-ranges-store";
import { getPrimarySelection } from "@/lib/excel-editor/selection-utils";
import type { ValidationStore } from "@/lib/excel-editor/validation-store";

type ExcelEditorDataPanelProps = {
  hotRef: React.RefObject<Handsontable.Core | null>;
  validationStoreRef: React.RefObject<ValidationStore | null>;
  namedRangesRef: React.RefObject<NamedRangesStore | null>;
  onToast: (msg: string) => void;
  onPersist: () => void;
  onValidationChange: () => void;
};

function PanelButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-xs font-semibold text-foreground transition hover:bg-muted"
    >
      {children}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

export function ExcelEditorDataPanel({
  hotRef,
  validationStoreRef,
  namedRangesRef,
  onToast,
  onPersist,
  onValidationChange,
}: ExcelEditorDataPanelProps) {
  const [validationCol, setValidationCol] = useState("0");
  const [validationList, setValidationList] = useState("Yes, No, Pending");
  const [rangeName, setRangeName] = useState("");

  const withHot = (fn: (hot: Handsontable.Core) => void) => {
    const hot = hotRef.current;
    if (hot) fn(hot);
  };

  const runSort = (mode: SortMode) => {
    withHot((hot) => {
      const col = getSortColumn(hot);
      if (col === null) {
        onToast("Select a cell in the column you want to sort.");
        return;
      }
      sortByColumn(hot, col, mode);
      onToast(
        mode === "text-asc"
          ? "Sorted A → Z"
          : mode === "text-desc"
            ? "Sorted Z → A"
            : mode === "numeric-asc"
              ? "Sorted smallest → largest"
              : "Sorted largest → smallest",
      );
      onPersist();
    });
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-2 py-1.5 sm:px-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Data</span>

      <motion.div layout className="flex flex-wrap items-center gap-1">
        <PanelButton label="A → Z" onClick={() => runSort("text-asc")}>
          <ArrowDownAZ className="h-3.5 w-3.5" aria-hidden />
        </PanelButton>
        <PanelButton label="Z → A" onClick={() => runSort("text-desc")}>
          <ArrowUpAZ className="h-3.5 w-3.5" aria-hidden />
        </PanelButton>
        <PanelButton label="Smallest → largest" onClick={() => runSort("numeric-asc")}>
          <ArrowUpDown className="h-3.5 w-3.5 rotate-180" aria-hidden />
        </PanelButton>
        <PanelButton label="Largest → smallest" onClick={() => runSort("numeric-desc")}>
          <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
        </PanelButton>
      </motion.div>

      <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />

      <div className="flex flex-wrap items-center gap-1">
        <PanelButton
          label="Enable filters"
          onClick={() =>
            withHot((hot) => {
              enableStructuredTable(hot);
              onToast("Filters enabled — use the ▾ menu on column headers.");
              onPersist();
            })
          }
        >
          <Filter className="h-3.5 w-3.5" aria-hidden />
        </PanelButton>
        <PanelButton
          label="Clear filters"
          onClick={() =>
            withHot((hot) => {
              clearAllFilters(hot);
              onToast("Filters cleared.");
            })
          }
        >
          <FilterX className="h-3.5 w-3.5" aria-hidden />
        </PanelButton>
        <PanelButton
          label="Convert to table"
          onClick={() =>
            withHot((hot) => {
              enableStructuredTable(hot);
              onToast("Structured table mode — sort & filter from column headers.");
              onPersist();
            })
          }
        >
          <Table2 className="h-3.5 w-3.5" aria-hidden />
        </PanelButton>
        <PanelButton
          label="Remove duplicates"
          onClick={() =>
            withHot((hot) => {
              const removed = removeDuplicateRows(hot);
              onToast(
                removed === 0
                  ? "No duplicate rows found."
                  : `Removed ${removed} duplicate row${removed === 1 ? "" : "s"}.`,
              );
              onPersist();
            })
          }
        >
          <CopyMinus className="h-3.5 w-3.5" aria-hidden />
        </PanelButton>
      </div>

      <span className="hidden h-5 w-px bg-border lg:block" aria-hidden />

      <motion.div layout className="flex flex-wrap items-center gap-1.5">
        <ListChecks className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <label className="sr-only" htmlFor="validation-col">
          Column for validation
        </label>
        <select
          id="validation-col"
          value={validationCol}
          onChange={(e) => setValidationCol(e.target.value)}
          className="h-8 max-w-[4.5rem] rounded-md border border-border bg-card px-1.5 text-xs font-semibold"
          aria-label="Validation column"
        >
          {Array.from({ length: 26 }, (_, i) => (
            <option key={i} value={String(i)}>
              Col {i + 1}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={validationList}
          onChange={(e) => setValidationList(e.target.value)}
          placeholder="Dropdown: Yes, No, Done"
          className="h-8 min-w-[8rem] max-w-[14rem] rounded-md border border-border bg-card px-2 text-xs"
          aria-label="Validation dropdown values comma separated"
        />
        <button
          type="button"
          onClick={() => {
            const col = Number(validationCol);
            const allowed = validationList
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            if (allowed.length === 0) {
              onToast("Enter at least one dropdown value.");
              return;
            }
            validationStoreRef.current?.set(col, { type: "list", allowed, strict: false });
            onValidationChange();
            onToast(`Column ${col + 1}: dropdown validation applied.`);
            onPersist();
          }}
          className="h-8 rounded-md border border-border bg-card px-2 text-xs font-semibold hover:bg-muted"
        >
          Apply validation
        </button>
      </motion.div>

      <span className="hidden h-5 w-px bg-border lg:block" aria-hidden />

      <motion.div layout className="flex flex-wrap items-center gap-1.5">
        <Tags className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <input
          type="text"
          value={rangeName}
          onChange={(e) => setRangeName(e.target.value)}
          placeholder="Range name (e.g. Sales)"
          className="h-8 w-[7.5rem] rounded-md border border-border bg-card px-2 text-xs sm:w-32"
          aria-label="Named range name"
        />
        <button
          type="button"
          onClick={() => {
            const hot = hotRef.current;
            if (!hot) return;
            const sel = getPrimarySelection(hot);
            if (!sel) {
              onToast("Select cells to define a named range.");
              return;
            }
            const name = rangeName.trim();
            if (!name) {
              onToast("Enter a range name.");
              return;
            }
            const ok = namedRangesRef.current?.define(name, {
              rowStart: sel.rowStart,
              colStart: sel.colStart,
              rowEnd: sel.rowEnd,
              colEnd: sel.colEnd,
            });
            if (!ok) {
              onToast("Invalid name — use letters, numbers, underscore.");
              return;
            }
            const ref = formatRangeRef({
              name,
              rowStart: sel.rowStart,
              colStart: sel.colStart,
              rowEnd: sel.rowEnd,
              colEnd: sel.colEnd,
            });
            onToast(`Named range "${name}" → ${ref}`);
            onPersist();
          }}
          className="h-8 rounded-md border border-border bg-card px-2 text-xs font-semibold hover:bg-muted"
        >
          Define range
        </button>
      </motion.div>
    </div>
  );
}
