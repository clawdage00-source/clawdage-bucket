"use client";

import type Handsontable from "handsontable";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Columns2,
  Italic,
  PaintBucket,
  Palette,
  Percent,
  IndianRupee,
  Underline,
} from "lucide-react";
import { useCallback, useState } from "react";

import type { CellFormatStore } from "@/lib/excel-editor/cell-format-store";
import {
  applyBordersToSelection,
  applyFormatToSelection,
  mergeSelectedCells,
  refreshConditionalFormatting,
  setConditionalRules,
  unmergeSelectedCells,
} from "@/lib/excel-editor/format-actions";
import type { ConditionalOperator, NumberFormatKind } from "@/lib/excel-editor/format-types";
import { getPrimarySelection } from "@/lib/excel-editor/selection-utils";

type ExcelEditorFormatBarProps = {
  hotRef: React.RefObject<Handsontable.Core | null>;
  formatStoreRef: React.RefObject<CellFormatStore | null>;
  onToast?: (message: string) => void;
  onPersist?: () => void;
};

const FONT_FAMILIES = [
  "inherit",
  "Inter, system-ui, sans-serif",
  "Georgia, serif",
  "ui-monospace, monospace",
];

const FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24];

function ToolbarDivider() {
  return <span className="mx-0.5 hidden h-6 w-px bg-border sm:block" aria-hidden />;
}

function IconBtn({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border text-foreground transition ${
        active ? "border-primary bg-primary/10" : "border-transparent hover:border-border hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

export function ExcelEditorFormatBar({ hotRef, formatStoreRef, onToast, onPersist }: ExcelEditorFormatBarProps) {
  const [condOpen, setCondOpen] = useState(false);
  const [condOp, setCondOp] = useState<ConditionalOperator>("gt");
  const [condVal, setCondVal] = useState("");
  const [condVal2, setCondVal2] = useState("");
  const [condBg, setCondBg] = useState("#dcfce7");

  const withHot = useCallback(
    (fn: (hot: Handsontable.Core, store: CellFormatStore) => void) => {
      const hot = hotRef.current;
      const store = formatStoreRef.current;
      if (!hot || !store) return;
      fn(hot, store);
    },
    [hotRef, formatStoreRef],
  );

  const patchSelection = (patch: Parameters<typeof applyFormatToSelection>[2]) => {
    withHot((hot, store) => {
      const sel = getPrimarySelection(hot);
      if (!sel) {
        onToast?.("Select cells to format.");
        return;
      }
      applyFormatToSelection(hot, store, patch);
      onPersist?.();
    });
  };

  const addConditionalRule = () => {
    if (!condVal.trim()) {
      onToast?.("Enter a rule value.");
      return;
    }
    withHot((hot, store) => {
      const rules = store.getRules();
      rules.push({
        id: `rule-${Date.now()}`,
        operator: condOp,
        value: condVal,
        value2: condOp === "between" ? condVal2 : undefined,
        format: { bgColor: condBg, bold: true },
      });
      setConditionalRules(hot, store, rules);
      onPersist?.();
      onToast?.("Conditional rule applied.");
      setCondOpen(false);
    });
  };

  const clearConditionalRules = () => {
    withHot((hot, store) => {
      setConditionalRules(hot, store, []);
      onPersist?.();
      onToast?.("Conditional rules cleared.");
    });
  };

  return (
    <div className="relative shrink-0 border-b border-border bg-muted/30 px-2 py-1.5 sm:px-3">
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:inline">
          Format
        </span>

        <select
          className="h-8 max-w-[7rem] rounded-md border border-border bg-card px-1.5 text-xs font-medium"
          defaultValue="inherit"
          aria-label="Font family"
          onChange={(e) => patchSelection({ fontFamily: e.target.value === "inherit" ? undefined : e.target.value })}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>
              {f === "inherit" ? "Font" : f.split(",")[0]}
            </option>
          ))}
        </select>

        <select
          className="h-8 w-14 rounded-md border border-border bg-card px-1 text-xs font-medium"
          defaultValue="13"
          aria-label="Font size"
          onChange={(e) => patchSelection({ fontSize: Number(e.target.value) })}
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <IconBtn label="Bold" onClick={() => patchSelection({ bold: true })}>
          <Bold className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Italic" onClick={() => patchSelection({ italic: true })}>
          <Italic className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Underline" onClick={() => patchSelection({ underline: true })}>
          <Underline className="h-4 w-4" />
        </IconBtn>

        <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-1.5 text-xs" title="Font color">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <input
            type="color"
            className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
            defaultValue="#0f172a"
            aria-label="Font color"
            onChange={(e) => patchSelection({ fontColor: e.target.value })}
          />
        </label>

        <ToolbarDivider />

        <select
          className="h-8 rounded-md border border-border bg-card px-1.5 text-xs font-medium"
          defaultValue="general"
          aria-label="Number format"
          onChange={(e) =>
            patchSelection({ numberFormat: e.target.value as NumberFormatKind })
          }
        >
          <option value="general">General</option>
          <option value="number">Number</option>
          <option value="currency">Currency (₹)</option>
          <option value="percent">Percent</option>
          <option value="date">Date</option>
        </select>

        <IconBtn
          label="Currency format"
          onClick={() => patchSelection({ numberFormat: "currency" })}
        >
          <IndianRupee className="h-4 w-4" />
        </IconBtn>
        <IconBtn
          label="Percent format"
          onClick={() => patchSelection({ numberFormat: "percent" })}
        >
          <Percent className="h-4 w-4" />
        </IconBtn>

        <ToolbarDivider />

        <IconBtn label="Align left" onClick={() => patchSelection({ align: "left" })}>
          <AlignLeft className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Align center" onClick={() => patchSelection({ align: "center" })}>
          <AlignCenter className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Align right" onClick={() => patchSelection({ align: "right" })}>
          <AlignRight className="h-4 w-4" />
        </IconBtn>

        <select
          className="h-8 rounded-md border border-border bg-card px-1 text-xs font-medium"
          defaultValue=""
          aria-label="Vertical align"
          onChange={(e) => {
            const v = e.target.value as "top" | "middle" | "bottom" | "";
            if (v) patchSelection({ valign: v });
            e.target.value = "";
          }}
        >
          <option value="">V-align</option>
          <option value="top">Top</option>
          <option value="middle">Middle</option>
          <option value="bottom">Bottom</option>
        </select>

        <select
          className="h-8 rounded-md border border-border bg-card px-1 text-xs font-medium"
          defaultValue=""
          aria-label="Text rotation"
          onChange={(e) => {
            const deg = Number(e.target.value);
            if (!Number.isNaN(deg)) patchSelection({ rotation: deg });
            e.target.value = "";
          }}
        >
          <option value="">Rotate</option>
          <option value="0">0°</option>
          <option value="45">45°</option>
          <option value="90">90°</option>
          <option value="-45">-45°</option>
        </select>

        <IconBtn label="Wrap text" onClick={() => patchSelection({ wrap: true })}>
          <span className="text-[10px] font-bold">Wrap</span>
        </IconBtn>

        <ToolbarDivider />

        <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-1.5 text-xs" title="Fill color">
          <PaintBucket className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <input
            type="color"
            className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
            defaultValue="#fef9c3"
            aria-label="Background color"
            onChange={(e) => patchSelection({ bgColor: e.target.value })}
          />
        </label>

        <select
          className="h-8 rounded-md border border-border bg-card px-1.5 text-xs font-medium"
          defaultValue=""
          aria-label="Borders"
          onChange={(e) => {
            const v = e.target.value as "all" | "outer" | "none" | "";
            if (!v) return;
            withHot((hot) => applyBordersToSelection(hot, v));
            e.target.value = "";
          }}
        >
          <option value="">Borders</option>
          <option value="all">All borders</option>
          <option value="outer">Outer border</option>
          <option value="none">Clear borders</option>
        </select>

        <IconBtn
          label="Merge cells"
          onClick={() => withHot((hot) => mergeSelectedCells(hot))}
        >
          <Columns2 className="h-4 w-4" />
        </IconBtn>
        <button
          type="button"
          className="h-8 rounded-md border border-border bg-card px-2 text-xs font-medium hover:bg-muted"
          onClick={() => withHot((hot) => unmergeSelectedCells(hot))}
        >
          Unmerge
        </button>

        <ToolbarDivider />

        <button
          type="button"
          className="h-8 rounded-md border border-border bg-card px-2 text-xs font-semibold hover:bg-muted"
          onClick={() => setCondOpen((o) => !o)}
        >
          Conditional
        </button>
      </div>

      {condOpen ? (
        <div className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-3">
          <label className="text-xs font-medium text-foreground">
            Rule
            <select
              className="mt-1 block h-8 rounded-md border border-border bg-background px-2 text-xs"
              value={condOp}
              onChange={(e) => setCondOp(e.target.value as ConditionalOperator)}
            >
              <option value="gt">Greater than</option>
              <option value="gte">Greater or equal</option>
              <option value="lt">Less than</option>
              <option value="lte">Less or equal</option>
              <option value="eq">Equal to</option>
              <option value="contains">Text contains</option>
              <option value="between">Between</option>
            </select>
          </label>
          <label className="text-xs font-medium text-foreground">
            Value
            <input
              type="text"
              value={condVal}
              onChange={(e) => setCondVal(e.target.value)}
              className="mt-1 block h-8 w-24 rounded-md border border-border bg-background px-2 text-xs"
            />
          </label>
          {condOp === "between" ? (
            <label className="text-xs font-medium text-foreground">
              And
              <input
                type="text"
                value={condVal2}
                onChange={(e) => setCondVal2(e.target.value)}
                className="mt-1 block h-8 w-24 rounded-md border border-border bg-background px-2 text-xs"
              />
            </label>
          ) : null}
          <label className="text-xs font-medium text-foreground">
            Highlight
            <input
              type="color"
              value={condBg}
              onChange={(e) => setCondBg(e.target.value)}
              className="mt-1 block h-8 w-12 cursor-pointer rounded border border-border"
            />
          </label>
          <button
            type="button"
            onClick={addConditionalRule}
            className="h-8 rounded-md bg-black px-3 text-xs font-semibold text-white hover:opacity-90"
          >
            Apply rule
          </button>
          <button
            type="button"
            onClick={clearConditionalRules}
            className="h-8 rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
          >
            Clear rules
          </button>
          <button
            type="button"
            onClick={() =>
              withHot((hot, store) => refreshConditionalFormatting(hot, store))
            }
            className="h-8 rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
          >
            Refresh
          </button>
        </div>
      ) : null}
    </div>
  );
}
