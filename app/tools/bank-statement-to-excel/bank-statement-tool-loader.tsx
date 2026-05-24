"use client";

import dynamic from "next/dynamic";

const BankStatementToExcelTool = dynamic(
  () =>
    import("@/components/tools/bank-statement-to-excel-tool").then((m) => m.BankStatementToExcelTool),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-600">
        Loading Bank Statement converter…
      </div>
    ),
  },
);

export function BankStatementToolLazy() {
  return <BankStatementToExcelTool />;
}
