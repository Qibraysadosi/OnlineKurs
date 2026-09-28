import { Trophy } from "lucide-react";
import { CurriculumAccordion } from "@/components/course";
import { ProgressBar } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CourseProgress, LessonOut, SectionOut } from "@/types";

export interface LearnSidebarProps {
  sections: SectionOut[];
  activeLessonId: number | null;
  progress: Pick<CourseProgress, "progress_percent" | "completed_lessons" | "total_lessons">;
  onSelect: (lesson: LessonOut) => void;
  className?: string;
}

/** Curriculum column with a progress summary on top. */
export function LearnSidebar({ sections, activeLessonId, progress, onSelect, className }: LearnSidebarProps) {
  const done = progress.progress_percent >= 100;
  return (
    <div className={cn("space-y-4", className)}>
      <div className="ok-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Kurs dasturi</h2>
          <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {progress.completed_lessons}/{progress.total_lessons} dars
          </span>
        </div>
        <ProgressBar value={progress.progress_percent} showLabel className="mt-3" label="Kurs progressi" />
        {done && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Trophy className="h-4 w-4" aria-hidden="true" />
            Tabriklaymiz, kurs to'liq yakunlandi!
          </p>
        )}
      </div>
      <CurriculumAccordion sections={sections} activeLessonId={activeLessonId} onSelect={(lesson) => onSelect(lesson)} defaultOpen="all" dense />
    </div>
  );
}
