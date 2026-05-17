import { ToolPageExtras } from "@/components/tools/tool-page-extras";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20 text-foreground md:pb-0">
      {children}
      <ToolPageExtras />
    </div>
  );
}
