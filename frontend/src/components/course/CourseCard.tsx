import { Clock, PlayCircle, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatDurationShort, formatNumber } from "@/lib/utils";
import type { CourseCard as CourseCardType } from "@/types";
import { CourseCover } from "./CourseCover";
import { LevelBadge } from "./LevelBadge";
import { PriceTag } from "./PriceTag";
import { RatingStars } from "./RatingStars";

export interface CourseCardProps {
  course: CourseCardType;
  /** When provided, a progress bar replaces the price row (enrollment cards) */
  progressPercent?: number;
  /** Override the link target (default `/courses/:slug`) */
  to?: string;
  className?: string;
  /** Show "Nashr qilinmagan" badge when the course is unpublished (teacher/admin lists) */
  showStatus?: boolean;
}

export function CourseCard({ course, progressPercent, to, className, showStatus }: CourseCardProps) {
  const href = to ?? `/courses/${course.slug}`;
  return (
    <article
      className={cn(
        "ok-card group flex h-full flex-col overflow-hidden hover:-translate-y-0.5",
        className,
      )}
    >
      <Link to={href} className="ok-focus relative block" aria-label={course.title}>
        <CourseCover course={course} />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <LevelBadge level={course.level} className="bg-white/90 shadow-sm backdrop-blur dark:bg-slate-900/80" />
          {showStatus && !course.is_published && (
            <Badge tone="warning" className="bg-white/90 shadow-sm backdrop-blur dark:bg-slate-900/80">
              Nashr qilinmagan
            </Badge>
          )}
        </div>
        {course.price <= 0 && (
          <Badge tone="success" className="absolute right-3 top-3 bg-white/90 shadow-sm backdrop-blur dark:bg-slate-900/80">
            Bepul
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          {course.category && (
            <p className="mb-1 text-xs font-medium text-primary-600 dark:text-primary-300">{course.category.name}</p>
          )}
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">
            <Link to={href} className="ok-focus rounded outline-none transition-colors hover:text-primary-700 dark:hover:text-primary-300">
              {course.title}
            </Link>
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Avatar src={course.teacher.avatar_url} name={course.teacher.full_name} size="xs" />
          <span className="truncate">{course.teacher.full_name}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <RatingStars value={course.rating_avg} showValue count={course.reviews_count} />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {formatNumber(course.students_count)}
          </span>
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
            {course.lessons_count} dars
          </span>
          {course.duration_minutes > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDurationShort(course.duration_minutes)}
            </span>
          )}
        </div>

        <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
          {progressPercent !== undefined ? (
            <ProgressBar value={progressPercent} showLabel label={`${course.title} progress`} />
          ) : (
            <PriceTag price={course.price} size="md" />
          )}
        </div>
      </div>
    </article>
  );
}

export function CourseCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("ok-card flex h-full flex-col overflow-hidden", className)} aria-hidden="true">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-3 w-32" />
        <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </div>
  );
}
