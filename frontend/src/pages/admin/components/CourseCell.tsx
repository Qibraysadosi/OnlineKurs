import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CourseCover } from "@/components/course";
import type { CourseCard } from "@/types";

export interface CourseCellProps {
  course: CourseCard;
  /** Link target for the title (defaults to the public course page) */
  to?: string;
  /** Router state passed with the link */
  state?: unknown;
  /** Line under the title (category, lesson count, teacher…) */
  meta?: ReactNode;
}

/** Cover thumbnail + linked title + meta line, for table rows and lists. */
export function CourseCell({ course, to = `/courses/${course.slug}`, state, meta }: CourseCellProps) {
  return (
    <div className="flex items-center gap-3">
      <CourseCover course={course} className="h-11 w-[72px] shrink-0 rounded-lg" letterClassName="text-lg" />
      <div className="min-w-0">
        <Link
          to={to}
          state={state}
          className="ok-focus block max-w-[220px] truncate rounded font-medium text-slate-900 transition hover:text-primary-600 dark:text-slate-100 dark:hover:text-primary-300"
        >
          {course.title}
        </Link>
        {meta && <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500 dark:text-slate-400">{meta}</p>}
      </div>
    </div>
  );
}
