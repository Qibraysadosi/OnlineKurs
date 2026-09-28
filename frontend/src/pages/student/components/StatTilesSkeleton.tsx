import { Skeleton } from "@/components/ui";

/** Shimmer placeholders shaped like a row of <StatCard>s. */
export function StatTilesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="ok-card flex items-center gap-4 p-5 sm:p-6" aria-hidden="true">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-20" />
          </div>
        </div>
      ))}
    </>
  );
}
