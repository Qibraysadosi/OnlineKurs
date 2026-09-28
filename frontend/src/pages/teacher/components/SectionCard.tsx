import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Check, Clock, FileText, GripVertical, Pencil, PlayCircle, Plus, Trash2, VideoOff, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Badge, Button, IconButton, Input } from "@/components/ui";
import { formatDurationShort } from "@/lib/utils";
import type { LessonOut, SectionOut } from "@/types";
import { sectionTitleSchema, type SectionFormValues } from "./schemas";

export interface SectionCardProps {
  section: SectionOut;
  index: number;
  total: number;
  /** Any curriculum mutation in flight — disables reorder buttons to avoid racing positions */
  busy: boolean;
  onMove: (direction: -1 | 1) => void;
  onRename: (title: string) => Promise<unknown>;
  onDelete: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: LessonOut) => void;
  onDeleteLesson: (lesson: LessonOut) => void;
  onMoveLesson: (lesson: LessonOut, direction: -1 | 1) => void;
}

/** One curriculum section: inline rename, reorder controls and its lesson rows. */
export function SectionCard({
  section,
  index,
  total,
  busy,
  onMove,
  onRename,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onMoveLesson,
}: SectionCardProps) {
  const [editing, setEditing] = useState(false);
  const form = useForm<SectionFormValues>({ resolver: zodResolver(sectionTitleSchema), defaultValues: { title: section.title } });

  const startEditing = () => {
    form.reset({ title: section.title });
    setEditing(true);
  };

  const submitRename = form.handleSubmit(async (values) => {
    if (values.title.trim() !== section.title) await onRename(values.title.trim());
    setEditing(false);
  });

  const lessonsMinutes = section.lessons.reduce((sum, lesson) => sum + lesson.duration_minutes, 0);

  return (
    <article className="ok-card overflow-hidden">
      {/* Below sm the action buttons drop to their own right-aligned row so the title is not squeezed. */}
      <header className="flex flex-wrap items-start gap-x-3 gap-y-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-nowrap sm:px-5">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-semibold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={submitRename} noValidate className="flex items-start gap-2">
              <Input
                aria-label="Bo'lim nomi"
                size="sm"
                autoFocus
                error={form.formState.errors.title?.message}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setEditing(false);
                }}
                {...form.register("title")}
              />
              <IconButton aria-label="Saqlash" size="sm" variant="primary" type="submit" loading={form.formState.isSubmitting}>
                <Check className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              <IconButton aria-label="Bekor qilish" size="sm" onClick={() => setEditing(false)} disabled={form.formState.isSubmitting}>
                <X className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </form>
          ) : (
            <>
              <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{section.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {section.lessons.length} ta dars
                {lessonsMinutes > 0 && ` · ${formatDurationShort(lessonsMinutes)}`}
              </p>
            </>
          )}
        </div>
        {!editing && (
          <div className="flex w-full shrink-0 items-center justify-end gap-0.5 sm:w-auto">
            <IconButton aria-label="Bo'limni yuqoriga" size="sm" disabled={busy || index === 0} onClick={() => onMove(-1)}>
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </IconButton>
            <IconButton aria-label="Bo'limni pastga" size="sm" disabled={busy || index === total - 1} onClick={() => onMove(1)}>
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </IconButton>
            <IconButton aria-label="Bo'lim nomini o'zgartirish" size="sm" onClick={startEditing}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </IconButton>
            <IconButton aria-label="Bo'limni o'chirish" size="sm" onClick={onDelete} className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </div>
        )}
      </header>

      {section.lessons.length > 0 ? (
        <ol className="divide-y divide-slate-200 dark:divide-slate-800">
          {section.lessons.map((lesson, lessonIndex) => (
            <li
              key={lesson.id}
              className="group flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 sm:flex-nowrap sm:px-5"
            >
              <GripVertical className="hidden h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600 sm:block" aria-hidden="true" />
              <span className="w-6 shrink-0 text-right text-xs tabular-nums text-slate-400">{lessonIndex + 1}.</span>
              <button
                type="button"
                onClick={() => onEditLesson(lesson)}
                className="ok-focus min-w-0 flex-1 rounded-md text-left"
                aria-label={`${lesson.title} — tahrirlash`}
              >
                <span className="flex items-center gap-2">
                  {lesson.video_url ? (
                    <PlayCircle className="h-4 w-4 shrink-0 text-primary-500" aria-label="Video bor" />
                  ) : (
                    <VideoOff className="h-4 w-4 shrink-0 text-amber-500" aria-label="Video yo'q" />
                  )}
                  <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{lesson.title}</span>
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 pl-6 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {formatDurationShort(lesson.duration_minutes)}
                  </span>
                  {lesson.attachment_url && (
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3 w-3" aria-hidden="true" />
                      Fayl
                    </span>
                  )}
                  {lesson.is_free_preview && <Badge tone="success">Bepul ko'rish</Badge>}
                </span>
              </button>
              <div className="flex w-full shrink-0 items-center justify-end gap-0.5 sm:w-auto">
                <IconButton aria-label="Darsni yuqoriga" size="sm" disabled={busy || lessonIndex === 0} onClick={() => onMoveLesson(lesson, -1)}>
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </IconButton>
                <IconButton
                  aria-label="Darsni pastga"
                  size="sm"
                  disabled={busy || lessonIndex === section.lessons.length - 1}
                  onClick={() => onMoveLesson(lesson, 1)}
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </IconButton>
                <IconButton aria-label="Darsni tahrirlash" size="sm" onClick={() => onEditLesson(lesson)}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </IconButton>
                <IconButton
                  aria-label="Darsni o'chirish"
                  size="sm"
                  onClick={() => onDeleteLesson(lesson)}
                  className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-4 py-5 text-center text-sm text-slate-500 dark:text-slate-400 sm:px-5">Bu bo'limda hali dars yo'q.</p>
      )}

      <footer className="border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
        <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={onAddLesson}>
          Dars qo'shish
        </Button>
      </footer>
    </article>
  );
}
