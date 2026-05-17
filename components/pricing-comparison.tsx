const ROWS = [
  { feature: "Browser-local processing", free: true, pass: true },
  { feature: "Aadhaar & exam photo tools", free: "Limited", pass: true },
  { feature: "Daily file limits", free: "3/day", pass: "Higher limits" },
  { feature: "Pro AI tools", free: false, pass: true },
  { feature: "Ads", free: "Yes", pass: "Reduced" },
  { feature: "Auto-debit subscription", free: false, pass: false },
  { feature: "Price", free: "₹0", pass: "From ₹19" },
] as const;

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="text-[#251EFF]">✓</span>;
  if (value === false) return <span className="text-muted-foreground">—</span>;
  return <span>{value}</span>;
}

export function PricingComparison() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 font-semibold text-foreground">Feature</th>
            <th className="px-4 py-3 font-semibold text-foreground">Free</th>
            <th className="px-4 py-3 font-semibold text-[#251EFF]">Daily Pass ₹19</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.feature} className="border-b border-border last:border-0">
              <td className="px-4 py-3 text-muted-foreground">{row.feature}</td>
              <td className="px-4 py-3">
                <Cell value={row.free} />
              </td>
              <td className="px-4 py-3 font-medium">
                <Cell value={row.pass} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
