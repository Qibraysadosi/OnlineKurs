import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock, Download, Layers, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { VideoPlayer } from "@/components/course";
import { Badge, Button, buttonClassName } from "@/components/ui";
import { formatDuration } from "@/lib/utils";
import type { CourseDetail, LessonOut, SectionOut } from "@/types";

export interface LessonContentProps {
  course: CourseDetail;
  lesson: LessonOut;
  section: SectionOut;
  /** 1-based index of the lesson in the whole course */
  index: number;
  total: number;
  prev: LessonOut | null;
  next: LessonOut | null;
  toggling: boolean;
  onToggleComplete: () => void;
  onNavigate: (lesson: LessonOut) => void;
  onEnded: () => void;
}

/** Video, meta, description, attachment, completion toggle and prev/next. */
export function LessonContent({ course, lesson, section, index, total, prev, next, toggling, onToggleComplete, onNavigate, onEnded }: LessonContentProps) {
  const locked = !lesson.has_access && !lesson.is_free_preview;
  return (
    <article className="space-y-6" aria-labelledby="lesson-title">
      <VideoPlayer
        key={lesson.id}
        src={locked ? null : lesson.video_url}
        title={lesson.title}
        locked={locked}
        onEnded={onEnded}
        lockedContent={
          locked ? (
            <Link to={`/checkout/${course.slug}`} className={buttonClassName({ variant: "gradient", size: "sm", className: "mt-1" })}>
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              Kursni sotib olish
            </Link>
          ) : undefined
        }
      />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              {section.title}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {index}/{total} dars
            </span>
            {lesson.duration_minutes > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDuration(lesson.duration_minutes)}
                </span>
              </>
            )}
          </p>
          <h1 id="lesson-title" className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            {lesson.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {lesson.is_completed && (
              <Badge tone="success" dot>
                Yakunlangan
              </Badge>
            )}
            {lesson.is_free_preview && <Badge tone="primary">Bepul ko'rish</Badge>}
          </div>
        </div>
        {!locked && (
          <Button
            variant={lesson.is_completed ? "outline" : "gradient"}
            loading={toggling}
            onClick={onToggleComplete}
            className="shrink-0"
            leftIcon={
              lesson.is_completed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" /> : <Circle className="h-4 w-4" aria-hidden="true" />
            }
          >
            {lesson.is_completed ? "Yakunlangan" : "Darsni yakunlash"}
          </Button>
        )}
      </header>

      {lesson.description ? (
        <section aria-label="Dars tavsifi" className="ok-card p-5 sm:p-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Dars haqida</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">{lesson.description}</p>
        </section>
      ) : null}

      {lesson.attachment_url && (
        <section aria-label="Dars materiallari" className="ok-card flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300" aria-hidden="true">
              <Download className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{lesson.attachment_name ?? "Qo'shimcha material"}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Darsga biriktirilgan fayl</p>
            </div>
          </div>
          <a
            href={lesson.attachment_url}
            download={lesson.attachment_name ?? true}
            target="_blank"
            rel="noreferrer"
            className={buttonClassName({ variant: "secondary", size: "sm" })}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Yuklab olish
          </a>
        </section>
      )}

      <nav aria-label="Darslar orasida o'tish" className="flex items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
        <Button variant="outline" disabled={!prev} onClick={() => prev && onNavigate(prev)} leftIcon={<ChevronLeft className="h-4 w-4" aria-hidden="true" />} className="max-w-[48%]">
          <span className="truncate">Oldingi dars</span>
        </Button>
        {next ? (
          <Button variant="primary" onClick={() => onNavigate(next)} rightIcon={<ChevronRight className="h-4 w-4" aria-hidden="true" />} className="max-w-[48%]">
            <span className="truncate">Keyingi dars</span>
          </Button>
        ) : (
          <Link to={`/courses/${course.slug}#reviews`} className={buttonClassName({ variant: "primary", className: "max-w-[48%]" })}>
            <span className="truncate">Kursni baholash</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </nav>
    </article>
  );
}
