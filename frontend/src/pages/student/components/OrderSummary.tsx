import { BarChart3, Clock, Infinity as InfinityIcon, PlayCircle, ShieldCheck } from "lucide-react";
import { type ReactNode } from "react";
import { CourseCover, LevelBadge } from "@/components/course";
import { Avatar, Card } from "@/components/ui";
import { formatDuration, formatPrice, levelLabel } from "@/lib/utils";
import type { CourseDetail } from "@/types";

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <span aria-hidden="true">{icon}</span>
        {label}
      </span>
      <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
    </li>
  );
}

/** Sticky "Buyurtma" card on the checkout page. */
export function OrderSummary({ course }: { course: CourseDetail }) {
  return (
    <Card flush className="overflow-hidden lg:sticky lg:top-24">
      <CourseCover course={course} />
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          {course.category && <span className="text-xs font-medium text-primary-600 dark:text-primary-300">{course.category.name}</span>}
          <LevelBadge level={course.level} />
        </div>
        <h2 className="mt-2 text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">{course.title}</h2>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Avatar src={course.teacher.avatar_url} name={course.teacher.full_name} size="xs" />
          <span className="truncate">{course.teacher.full_name}</span>
        </div>

        <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Row icon={<PlayCircle className="h-4 w-4" />} label="Darslar" value={`${course.lessons_count} ta`} />
          {course.duration_minutes > 0 && <Row icon={<Clock className="h-4 w-4" />} label="Davomiyligi" value={formatDuration(course.duration_minutes)} />}
          <Row icon={<BarChart3 className="h-4 w-4" />} label="Daraja" value={levelLabel(course.level)} />
          <Row icon={<InfinityIcon className="h-4 w-4" />} label="Kirish" value="Umrbod" />
        </ul>

        <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <dt>Kurs narxi</dt>
            <dd className="tabular-nums">{formatPrice(course.price)}</dd>
          </div>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <dt>Chegirma</dt>
            <dd className="tabular-nums">0 so'm</dd>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
            <dt>Jami</dt>
            <dd className="tabular-nums">{formatPrice(course.price)}</dd>
          </div>
        </dl>

        <p className="mt-4 inline-flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          Bu test to'lov: haqiqiy pul yechilmaydi, kurs darhol ochiladi.
        </p>
      </div>
    </Card>
  );
}
