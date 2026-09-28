import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, ExternalLink, Layers, PlayCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { coursesApi, getErrorMessage } from "@/api";
import { Alert, Badge, Button, Card, CardHeader, ConfirmDialog, Switch, buttonClassName } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import type { CourseDetail } from "@/types";

interface PublishTabProps {
  course: CourseDetail;
  onCourseChange: (course: CourseDetail) => void;
  onDelete: () => Promise<unknown>;
  deleting: boolean;
  onGoToTab: (tab: "info" | "curriculum") => void;
}

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  done: boolean;
  required: boolean;
  tab: "info" | "curriculum";
}

/** Readiness checklist, publish switch and the danger zone. */
export function PublishTab({ course, onCourseChange, onDelete, deleting, onGoToTab }: PublishTabProps) {
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const lessonsCount = course.sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const lessonsWithVideo = course.sections.reduce(
    (sum, section) => sum + section.lessons.filter((lesson) => Boolean(lesson.video_url)).length,
    0,
  );

  const checklist: ChecklistItem[] = [
    {
      key: "lessons",
      label: "Kamida bitta dars",
      description: lessonsCount > 0 ? `${lessonsCount} ta dars, ${course.sections.length} ta bo'lim` : "Dasturi bo'limida bo'lim va dars qo'shing",
      done: lessonsCount > 0,
      required: true,
      tab: "curriculum",
    },
    {
      key: "video",
      label: "Har bir darsda video",
      description: lessonsCount > 0 ? `${lessonsWithVideo} / ${lessonsCount} ta darsda video bor` : "Darslarga video yuklang yoki havola qo'shing",
      done: lessonsCount > 0 && lessonsWithVideo === lessonsCount,
      required: false,
      tab: "curriculum",
    },
    {
      key: "cover",
      label: "Muqova rasmi",
      description: course.cover_url ? "Rasm yuklangan" : "Rasmsiz kurs katalogda gradient bilan ko'rinadi",
      done: Boolean(course.cover_url),
      required: false,
      tab: "info",
    },
    {
      key: "description",
      label: "Batafsil tavsif",
      description: course.description.trim().length >= 100 ? "Tavsif yetarli" : "Kamida 100 belgili tavsif tavsiya qilinadi",
      done: course.description.trim().length >= 100,
      required: false,
      tab: "info",
    },
    {
      key: "outcomes",
      label: "Nimalarni o'rganasiz ro'yxati",
      description: course.what_you_learn.length > 0 ? `${course.what_you_learn.length} ta band` : "Kamida bitta band qo'shing",
      done: course.what_you_learn.length > 0,
      required: false,
      tab: "info",
    },
    {
      key: "category",
      label: "Kategoriya tanlangan",
      description: course.category ? course.category.name : "Kategoriyasiz kurs filtrlarda chiqmaydi",
      done: Boolean(course.category),
      required: false,
      tab: "info",
    },
  ];

  const canPublish = checklist.filter((item) => item.required).every((item) => item.done);
  const doneCount = checklist.filter((item) => item.done).length;

  const publish = useMutation({
    mutationFn: (is_published: boolean) => coursesApi.publish(course.id, { is_published }),
    onSuccess: (updated) => {
      toast.success(updated.is_published ? "Kurs nashr qilindi" : "Kurs nashrdan olindi");
      onCourseChange(updated);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Nashrga tayyorlik"
            description="Kurs katalogda ko'rinishi uchun majburiy bandlar bajarilishi kerak."
            actions={
              <Badge tone={doneCount === checklist.length ? "success" : "neutral"} size="md">
                {doneCount} / {checklist.length}
              </Badge>
            }
          />
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {checklist.map((item) => (
              <li key={item.key} className="flex items-start gap-3 py-3">
                {item.done ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-label="Bajarilgan" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" aria-label="Bajarilmagan" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {item.label}
                    {item.required && (
                      <Badge tone={item.done ? "success" : "warning"}>Majburiy</Badge>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>
                {!item.done && (
                  <Button variant="ghost" size="xs" onClick={() => onGoToTab(item.tab)}>
                    To'ldirish
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900/60">
          <CardHeader
            title="Xavfli hudud"
            description="Kursni o'chirsangiz barcha bo'limlar, darslar, yozilishlar va sharhlar ham o'chadi. Bu amalni ortga qaytarib bo'lmaydi."
          />
          <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />} onClick={() => setConfirmDelete(true)}>
            Kursni o'chirish
          </Button>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className={cn(course.is_published && "border-emerald-200 dark:border-emerald-900/60")}>
          <CardHeader title="Holat" />
          <Switch
            checked={course.is_published}
            onChange={(next) => publish.mutate(next)}
            disabled={publish.isPending || (!course.is_published && !canPublish)}
            label={course.is_published ? "Nashr qilingan" : "Qoralama"}
            description={
              course.is_published
                ? "Kurs katalogda ko'rinadi va talabalar yozilishi mumkin."
                : canPublish
                  ? "Yoqing — kurs darhol katalogda paydo bo'ladi."
                  : "Nashr qilish uchun kamida bitta dars qo'shing."
            }
          />
          {!course.is_published && !canPublish && (
            <Alert tone="warning" className="mt-4">
              Dasturi bo'limida bo'lim yarating va unga kamida bitta dars qo'shing.
            </Alert>
          )}
          <Link
            to={`/courses/${course.slug}`}
            className={buttonClassName({ variant: "outline", fullWidth: true, className: "mt-4" })}
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Talaba ko'rinishi
          </Link>
        </Card>

        <Card>
          <CardHeader title="Qisqacha" />
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Layers className="h-4 w-4" aria-hidden="true" />
                Bo'limlar
              </dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">{course.sections.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                Darslar
              </dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">{lessonsCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Clock className="h-4 w-4" aria-hidden="true" />
                Davomiylik
              </dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">{formatDuration(course.duration_minutes)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-800">
              <dt className="text-slate-500 dark:text-slate-400">Yaratilgan</dt>
              <dd className="text-slate-700 dark:text-slate-300">{formatDate(course.created_at)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Yangilangan</dt>
              <dd className="text-slate-700 dark:text-slate-300">{formatDate(course.updated_at)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Kursni o'chirasizmi?"
        description={`"${course.title}" va unga tegishli barcha ma'lumotlar butunlay o'chiriladi.`}
        confirmText="O'chirish"
        loading={deleting}
        onConfirm={async () => {
          await onDelete();
        }}
      />
    </div>
  );
}
