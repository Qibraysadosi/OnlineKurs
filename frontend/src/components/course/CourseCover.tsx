import { useState } from "react";
import { categoryGradient, cn } from "@/lib/utils";
import type { CourseCard as CourseCardType } from "@/types";

export interface CourseCoverProps {
  course: Pick<CourseCardType, "title" | "cover_url" | "category">;
  className?: string;
  /** Text size of the fallback initial */
  letterClassName?: string;
}

/** Cover image or a category-colored gradient with the course's first letter. */
export function CourseCover({ course, className, letterClassName }: CourseCoverProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(course.cover_url) && !failed;
  const letter = course.title.trim().charAt(0).toUpperCase() || "K";
  return (
    <div className={cn("relative aspect-video w-full overflow-hidden bg-slate-200 dark:bg-slate-800", className)}>
      {showImage ? (
        <img
          src={course.cover_url ?? undefined}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br", categoryGradient(course.category?.slug ?? course.title))}>
          <span className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" aria-hidden="true" />
          <span className="absolute -bottom-10 -left-4 h-32 w-32 rounded-full bg-black/10" aria-hidden="true" />
          <span className={cn("relative select-none text-5xl font-bold text-white/90 drop-shadow", letterClassName)} aria-hidden="true">
            {letter}
          </span>
        </div>
      )}
    </div>
  );
}
