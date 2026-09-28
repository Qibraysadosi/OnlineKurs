import { CheckCircle2, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { CourseCover } from "@/components/course";
import { ProgressBar, Skeleton, buttonClassName } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";
import type { Enrollment } from "@/types";
import { learnPathFor } from "./learnPath";

export interface EnrollmentRowProps {
  enrollment: Enrollment;
  className?: string;
}

/** Horizontal enrollment card: cover, title, progress and a resume button. */
export function EnrollmentRow({ enrollment, className }: EnrollmentRowProps) {
  const { course } = enrollment;
  const done = enrollment.progress_percent >= 100;
  const href = learnPathFor(enrollment);
  return (
    <article className={cn("ok-card group flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5", className)}>
      <Link to={href} className="ok-focus block shrink-0 overflow-hidden rounded-xl sm:w-40" aria-label={course.title}>
        <CourseCover course={course} className="rounded-xl" letterClassName="text-3xl" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {course.category && <span className="font-medium text-primary-600 dark:text-primary-300">{course.category.name}</span>}
          <span aria-hidden="true">·</span>
          <span>{course.teacher.full_name}</span>
        </div>
        <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">
          <Link to={href} className="ok-focus rounded outline-none transition-colors hover:text-primary-700 dark:hover:text-primary-300">
            {course.title}
          </Link>
        </h3>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={enrollment.progress_percent} label={`${course.title} progressi`} className="flex-1" />
          <span className="shrink-0 text-xs font-medium tabular-nums text-slate-600 dark:text-slate-400">
            {enrollment.completed_lessons}/{enrollment.total_lessons} dars
          </span>
        </div>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {done ? "Kurs to'liq yakunlandi" : `${enrollment.progress_percent}% bajarildi`} · Yozilgan: {formatDate(enrollment.created_at)}
        </p>
      </div>
      <div className="shrink-0 sm:self-center">
        <Link
          to={href}
          className={buttonClassName({ variant: done ? "outline" : "gradient", size: "md", fullWidth: true, className: "sm:w-auto" })}
        >
          {done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <PlayCircle className="h-4 w-4" aria-hidden="true" />}
          {done ? "Qayta ko'rish" : enrollment.completed_lessons > 0 ? "Davom etish" : "Boshlash"}
        </Link>
      </div>
    </article>
  );
}

export function EnrollmentRowSkeleton() {
  return (
    <div className="ok-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5" aria-hidden="true">
      <Skeleton className="aspect-video w-full rounded-xl sm:w-40" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl sm:w-32" />
    </div>
  );
}
