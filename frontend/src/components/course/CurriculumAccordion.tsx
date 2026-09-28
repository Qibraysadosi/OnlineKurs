import { CheckCircle2, ChevronDown, Lock, PlayCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDuration, formatDurationShort } from "@/lib/utils";
import type { LessonOut, SectionOut } from "@/types";

export interface CurriculumAccordionProps {
  sections: SectionOut[];
  /** Highlights this lesson (learn page) */
  activeLessonId?: number | null;
  /** Called when a lesson row is clicked. Locked lessons are still reported so the page can prompt to buy. */
  onSelect?: (lesson: LessonOut, section: SectionOut) => void;
  /** Sections open by default: "all", "first" or "active" (section containing activeLessonId) */
  defaultOpen?: "all" | "first" | "active";
  /** Compact rows for sidebars */
  dense?: boolean;
  className?: string;
}

function lessonIcon(lesson: LessonOut) {
  if (lesson.is_completed) return <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Yakunlangan" />;
  if (lesson.has_access || lesson.is_free_preview) return <PlayCircle className="h-4 w-4 text-primary-500" aria-label="Ko'rish mumkin" />;
  return <Lock className="h-4 w-4 text-slate-400" aria-label="Yopiq" />;
}

export function CurriculumAccordion({
  sections,
  activeLessonId,
  onSelect,
  defaultOpen = "first",
  dense,
  className,
}: CurriculumAccordionProps) {
  const [open, setOpen] = useState<Set<number>>(() => {
    if (defaultOpen === "all") return new Set(sections.map((s) => s.id));
    if (defaultOpen === "active" && activeLessonId) {
      const active = sections.find((s) => s.lessons.some((l) => l.id === activeLessonId));
      return new Set(active ? [active.id] : sections[0] ? [sections[0].id] : []);
    }
    return new Set(sections[0] ? [sections[0].id] : []);
  });

  const toggle = (id: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className={cn("divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white/80 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/60", className)}>
      {sections.map((section, idx) => {
        const isOpen = open.has(section.id);
        const total = section.lessons.reduce((sum, l) => sum + l.duration_minutes, 0);
        const done = section.lessons.filter((l) => l.is_completed).length;
        const panelId = `section-panel-${section.id}`;
        return (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => toggle(section.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className={cn(
                "ok-focus flex w-full items-center gap-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60",
                dense ? "px-3 py-2.5" : "px-4 py-3.5",
              )}
            >
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate font-semibold text-slate-900 dark:text-slate-100", dense ? "text-sm" : "text-sm sm:text-base")}>
                  {idx + 1}. {section.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {section.lessons.length} ta dars
                  {total > 0 && ` · ${formatDuration(total)}`}
                  {done > 0 && ` · ${done}/${section.lessons.length} yakunlangan`}
                </p>
              </div>
            </button>
            {isOpen && (
              <ul id={panelId} className="border-t border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/40">
                {section.lessons.map((lesson, lessonIdx) => {
                  const active = lesson.id === activeLessonId;
                  const clickable = Boolean(onSelect);
                  const locked = !lesson.has_access && !lesson.is_free_preview;
                  const Row = clickable ? "button" : "div";
                  return (
                    <li key={lesson.id}>
                      <Row
                        type={clickable ? "button" : undefined}
                        onClick={clickable ? () => onSelect?.(lesson, section) : undefined}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "flex w-full items-center gap-3 text-left transition-colors",
                          dense ? "px-3 py-2" : "px-4 py-2.5 sm:px-5",
                          clickable && "ok-focus hover:bg-white dark:hover:bg-slate-800/60",
                          active && "bg-primary-50 dark:bg-primary-950/40",
                          locked && "opacity-80",
                        )}
                      >
                        <span className="shrink-0">{lessonIcon(lesson)}</span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block truncate text-sm",
                              active ? "font-semibold text-primary-700 dark:text-primary-300" : "text-slate-700 dark:text-slate-300",
                            )}
                          >
                            {lessonIdx + 1}. {lesson.title}
                          </span>
                        </span>
                        {lesson.is_free_preview && !lesson.is_completed && (
                          <Badge tone="primary" className="hidden sm:inline-flex">
                            Bepul ko'rish
                          </Badge>
                        )}
                        {lesson.duration_minutes > 0 && (
                          <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                            {formatDurationShort(lesson.duration_minutes)}
                          </span>
                        )}
                      </Row>
                    </li>
                  );
                })}
                {section.lessons.length === 0 && (
                  <li className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">Bu bo'limda hali darslar yo'q</li>
                )}
              </ul>
            )}
          </div>
        );
      })}
      {sections.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">Kurs dasturi hali qo'shilmagan</p>
      )}
    </div>
  );
}
