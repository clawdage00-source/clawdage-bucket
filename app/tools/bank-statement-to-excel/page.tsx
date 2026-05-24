import { ToolJsonLd } from "@/components/JsonLd";
import { BankStatementToolLazy } from "@/app/tools/bank-statement-to-excel/bank-statement-tool-loader";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("bank-statement-to-excel");
}

export default function BankStatementToExcelPage() {
  return (
    <>
      <ToolJsonLd slug="bank-statement-to-excel" />
      <BankStatementToolLazy />
    </>
  );
}
