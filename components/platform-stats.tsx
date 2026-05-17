const STATS = [
  { value: "1M+", label: "Files processed" },
  { value: "50K+", label: "Users across India" },
  { value: "100%", label: "Browser processing" },
  { value: "99.9%", label: "Platform uptime" },
] as const;

export function PlatformStats({ className = "" }: { className?: string }) {
  return (
    <ul className={`grid grid-cols-2 gap-4 sm:grid-cols-4 ${className}`} aria-label="Platform statistics">
      {STATS.map(({ value, label }) => (
        <li key={label} className="rounded-xl border border-border bg-card px-4 py-5 text-center">
          <p className="text-2xl font-bold text-[#251EFF]">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </li>
      ))}
    </ul>
  );
}
