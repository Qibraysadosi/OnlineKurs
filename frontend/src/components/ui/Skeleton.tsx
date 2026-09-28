import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
  /** Renders `count` copies (each gets the same classes) */
  count?: number;
}

/** Shimmering placeholder. Size it with width/height classes: `<Skeleton className="h-4 w-32" />` */
export function Skeleton({ className, count = 1 }: SkeletonProps) {
  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={cn("ok-skeleton", className)} aria-hidden="true" />
        ))}
      </>
    );
  }
  return <div className={cn("ok-skeleton", className)} aria-hidden="true" />;
}

/** Several text lines with a shorter last line. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={cn("ok-skeleton h-3.5", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}
