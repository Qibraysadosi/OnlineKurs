import { Container } from "@/components/layout/Container";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

/** Mirrors the CourseDetailPage layout (dark hero + content column + sticky card) while the course loads. */
export function CourseDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Kurs yuklanmoqda">
      <div className="border-b border-slate-200 bg-slate-900 dark:border-slate-800 dark:bg-slate-950">
        <Container className="py-10 sm:py-14 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          <div className="space-y-4">
            <Skeleton className="h-3.5 w-48 bg-slate-800" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-24 rounded-full bg-slate-800" />
              <Skeleton className="h-5 w-20 rounded-full bg-slate-800" />
            </div>
            <Skeleton className="h-9 w-3/4 bg-slate-800" />
            <Skeleton className="h-9 w-1/2 bg-slate-800" />
            <Skeleton className="h-4 w-full bg-slate-800" />
            <Skeleton className="h-4 w-2/3 bg-slate-800" />
            <div className="flex flex-wrap gap-4 pt-2">
              <Skeleton className="h-4 w-24 bg-slate-800" count={3} />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
              <Skeleton className="h-4 w-40 bg-slate-800" />
            </div>
          </div>
        </Container>
      </div>
      <Container className="flex flex-col gap-8 py-8 sm:py-12 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
        <div className="order-first lg:order-last lg:-mt-52">
          <div className="ok-card overflow-hidden">
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="space-y-4 p-5">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-4 w-full" count={4} />
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <div className="ok-card p-5 sm:p-6">
            <Skeleton className="mb-4 h-6 w-48" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-4 w-full" count={6} />
            </div>
          </div>
          <div className="ok-card p-5 sm:p-6">
            <Skeleton className="mb-4 h-6 w-40" />
            <Skeleton className="h-12 w-full" count={4} />
          </div>
          <div className="ok-card p-5 sm:p-6">
            <Skeleton className="mb-4 h-6 w-32" />
            <SkeletonText lines={4} />
          </div>
        </div>
      </Container>
    </div>
  );
}
