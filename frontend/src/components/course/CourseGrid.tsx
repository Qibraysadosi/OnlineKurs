import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CourseCard as CourseCardType } from "@/types";
import { CourseCard, CourseCardSkeleton } from "./CourseCard";

export interface CourseGridProps {
  courses: CourseCardType[];
  /** Renders skeleton cards instead of `courses` */
  loading?: boolean;
  skeletonCount?: number;
  /** Rendered when not loading and `courses` is empty (usually <EmptyState>) */
  empty?: ReactNode;
  /** 3 (default, with sidebar) or 4 columns at xl */
  columns?: 3 | 4;
  /** Per-course progress (enrollment grids): courseId -> percent */
  progressByCourseId?: Record<number, number>;
  /** Per-course link override */
  linkFor?: (course: CourseCardType) => string;
  showStatus?: boolean;
  className?: string;
}

export function CourseGrid({
  courses,
  loading,
  skeletonCount = 6,
  empty,
  columns = 3,
  progressByCourseId,
  linkFor,
  showStatus,
  className,
}: CourseGridProps) {
  const gridClass = cn(
    "grid gap-5 sm:grid-cols-2",
    columns === 4 ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-3",
    className,
  );

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (courses.length === 0) return <>{empty ?? null}</>;

  return (
    <div className={cn(gridClass, "animate-in")}>
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          progressPercent={progressByCourseId?.[course.id]}
          to={linkFor?.(course)}
          showStatus={showStatus}
        />
      ))}
    </div>
  );
}
