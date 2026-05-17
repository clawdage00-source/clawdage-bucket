import type { ToolExample } from "@/lib/seo/tool-rich-content";
import { cn } from "@/lib/utils";

type ToolExampleCardProps = {
  example: ToolExample;
  className?: string;
};

export function ToolExampleCard({ example, className }: ToolExampleCardProps) {
  return (
    <section
      className={cn("rounded-2xl border border-border bg-card p-6 shadow-sm", className)}
      aria-labelledby="tool-example-heading"
    >
      <h3 id="tool-example-heading" className="text-lg font-bold text-foreground">
        {example.title}
      </h3>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-dashed border-border bg-muted/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{example.beforeLabel}</p>
          <p className="mt-2 text-sm font-medium text-foreground">{example.beforeValue}</p>
        </div>
        <div className="rounded-xl border border-[#251EFF]/30 bg-[#251EFF]/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#251EFF]">{example.afterLabel}</p>
          <p className="mt-2 text-sm font-medium text-foreground">{example.afterValue}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{example.note}</p>
    </section>
  );
}
