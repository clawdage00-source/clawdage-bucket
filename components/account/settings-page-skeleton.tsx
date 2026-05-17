import { Skeleton } from "@/components/ui/skeleton";

export function SettingsPageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-36 w-full rounded-2xl" />
    </div>
  );
}
