import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Eye, GraduationCap, Pencil, Plus, Star, Trash2, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { coursesApi, getErrorMessage, queryKeys, teacherApi } from "@/api";
import { CourseCover, PriceTag, RatingStars } from "@/components/course";
import { ErrorFallback } from "@/components/guards";
import { PageHeader } from "@/components/layout";
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Skeleton,
  StatCard,
  Switch,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  TableContainer,
  TableSkeletonRows,
  buttonClassName,
} from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useToast } from "@/hooks/useToast";
import { cn, formatCompact, formatNumber, formatPrice, formatRating } from "@/lib/utils";
import type { CourseCard } from "@/types";

const TABLE_COLS = 6;
/** Tighter cells (same as the admin tables) so six columns fit the dashboard content width at 1280px. */
const CELL = "px-3 first:pl-4 last:pr-4";

function greetingName(fullName: string | undefined): string {
  return fullName?.trim().split(/\s+/)[0] ?? "";
}

export default function TeacherDashboardPage() {
  useDocumentTitle("O'qituvchi paneli");
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<CourseCard | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const stats = useQuery({ queryKey: queryKeys.teacher.stats, queryFn: teacherApi.stats });
  const courses = useQuery({ queryKey: queryKeys.teacher.courses, queryFn: teacherApi.courses });

  const invalidateCourse = (course: CourseCard) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.course(course.slug) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.teacher.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
  };

  const publish = useMutation({
    mutationFn: ({ course, is_published }: { course: CourseCard; is_published: boolean }) =>
      coursesApi.publish(course.id, { is_published }),
    onMutate: ({ course }) => setTogglingId(course.id),
    onSuccess: (updated, { course }) => {
      toast.success(updated.is_published ? "Kurs nashr qilindi" : "Kurs nashrdan olindi");
      invalidateCourse(course);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
    onSettled: () => setTogglingId(null),
  });

  const remove = useMutation({
    mutationFn: (course: CourseCard) => coursesApi.remove(course.id),
    onSuccess: (_, course) => {
      toast.success("Kurs o'chirildi");
      invalidateCourse(course);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const newCourseLink = (
    <Link to="/teacher/courses/new" className={buttonClassName({ variant: "gradient" })}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      Yangi kurs
    </Link>
  );

  return (
    <div className="animate-in">
      <PageHeader
        title={`Salom, ${greetingName(user?.full_name)}!`}
        description="Kurslaringiz, talabalaringiz va daromadingiz bir joyda."
        actions={newCourseLink}
      />

      <section aria-label="Statistika" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.isPending ? (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="ok-card flex items-center gap-4 p-5 sm:p-6">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-7 w-20" />
              </div>
            </div>
          ))
        ) : stats.isError ? (
          <ErrorFallback
            className="sm:col-span-2 xl:col-span-4 rounded-2xl border border-dashed border-rose-200 px-4 py-8 dark:border-rose-900"
            message={getErrorMessage(stats.error)}
            onRetry={() => stats.refetch()}
          />
        ) : (
          <>
            <StatCard label="Kurslar" value={formatNumber(stats.data.courses_count)} icon={<BookOpen className="h-6 w-6" />} tone="primary" />
            <StatCard label="Talabalar" value={formatNumber(stats.data.students_count)} icon={<Users className="h-6 w-6" />} tone="info" />
            <StatCard
              label="Daromad"
              value={formatCompact(stats.data.revenue)}
              hint={stats.data.revenue > 0 ? formatPrice(stats.data.revenue) : "Hali to'lovlar yo'q"}
              icon={<Wallet className="h-6 w-6" />}
              tone="success"
            />
            <StatCard
              label="O'rtacha baho"
              value={formatRating(stats.data.reviews_avg)}
              hint="5 ballik tizimda"
              icon={<Star className="h-6 w-6" />}
              tone="warning"
            />
          </>
        )}
      </section>

      <section aria-labelledby="courses-heading" className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="courses-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Mening kurslarim
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {courses.data ? `${courses.data.length} ta kurs, ${courses.data.filter((c) => c.is_published).length} tasi nashr qilingan` : "Barcha kurslaringiz"}
            </p>
          </div>
        </div>

        {courses.isError ? (
          <ErrorFallback message={getErrorMessage(courses.error)} onRetry={() => courses.refetch()} />
        ) : courses.data && courses.data.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="h-7 w-7" aria-hidden="true" />}
            title="Hali kurslaringiz yo'q"
            description="Birinchi kursingizni yarating: ma'lumotlarni to'ldiring, darslar qo'shing va nashr qiling."
            action={newCourseLink}
          />
        ) : (
          <TableContainer>
            <Table className="min-w-[760px]">
              <THead>
                <TR>
                  <TH className={CELL}>Kurs</TH>
                  <TH align="right" className={CELL}>
                    Talabalar
                  </TH>
                  <TH className={CELL}>Baho</TH>
                  <TH align="right" className={CELL}>
                    Narx
                  </TH>
                  <TH align="center" className={CELL}>
                    Nashr
                  </TH>
                  <TH align="right" className={CELL}>
                    Amallar
                  </TH>
                </TR>
              </THead>
              <TBody>
                {courses.isPending ? (
                  <TableSkeletonRows rows={4} cols={TABLE_COLS} />
                ) : (
                  courses.data.map((course) => (
                    <TR key={course.id}>
                      <TD className={CELL}>
                        <div className="flex items-center gap-3">
                          <CourseCover course={course} className="h-11 w-[72px] shrink-0 rounded-lg" letterClassName="text-lg" />
                          <div className="min-w-0">
                            <Link
                              to={`/teacher/courses/${course.id}/edit`}
                              className="ok-focus block max-w-[220px] truncate rounded font-medium text-slate-900 transition hover:text-primary-600 dark:text-slate-100 dark:hover:text-primary-300"
                            >
                              {course.title}
                            </Link>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                              {course.is_published ? (
                                <Badge tone="success" dot>
                                  Nashrda
                                </Badge>
                              ) : (
                                <Badge tone="warning" dot>
                                  Qoralama
                                </Badge>
                              )}
                              <span className="truncate">
                                {course.category?.name ?? "Kategoriyasiz"} · {course.lessons_count} ta dars
                              </span>
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD align="right" className={cn(CELL, "tabular-nums")}>
                        {formatNumber(course.students_count)}
                      </TD>
                      <TD className={cn(CELL, "whitespace-nowrap")}>
                        <RatingStars value={course.rating_avg} showValue count={course.reviews_count} />
                      </TD>
                      <TD align="right" className={cn(CELL, "whitespace-nowrap")}>
                        <PriceTag price={course.price} size="sm" />
                      </TD>
                      <TD align="center" className={CELL}>
                        <div className="flex justify-center">
                          <Switch
                            size="sm"
                            checked={course.is_published}
                            disabled={togglingId === course.id}
                            aria-label={course.is_published ? `${course.title} — nashrdan olish` : `${course.title} — nashr qilish`}
                            onChange={(next) => publish.mutate({ course, is_published: next })}
                          />
                        </div>
                      </TD>
                      <TD align="right" className={CELL}>
                        <div className="flex items-center justify-end gap-0.5">
                          <Link
                            to={`/teacher/courses/${course.id}/edit`}
                            aria-label={`${course.title} — tahrirlash`}
                            className={buttonClassName({ variant: "ghost", size: "sm", className: "h-8 w-8 px-0" })}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <Link
                            to={`/courses/${course.slug}`}
                            aria-label={`${course.title} — ko'rish`}
                            className={buttonClassName({ variant: "ghost", size: "sm", className: "h-8 w-8 px-0" })}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <IconButton
                            aria-label={`${course.title} — o'chirish`}
                            size="sm"
                            onClick={() => setDeleteTarget(course)}
                            className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </IconButton>
                        </div>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </TableContainer>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Kursni o'chirasizmi?"
        description={`"${deleteTarget?.title}" kursi, uning darslari va talabalar yozilishlari butunlay o'chiriladi.`}
        confirmText="O'chirish"
        loading={remove.isPending}
        onConfirm={() => remove.mutateAsync(deleteTarget!)}
      />
    </div>
  );
}
