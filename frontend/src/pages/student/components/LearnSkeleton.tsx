import { Skeleton, SkeletonText } from "@/components/ui";

/** Full-height placeholder for the learn page while the course loads. */
export function LearnSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-hidden="true">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="ml-auto h-2 w-40" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-40" />
            <SkeletonText lines={4} />
          </div>
        </div>
        <aside className="hidden w-[360px] shrink-0 border-l border-slate-200 p-4 lg:block xl:w-[400px] dark:border-slate-800">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-12 w-full rounded-xl" count={5} />
          </div>
        </aside>
      </div>
    </div>
  );
}
