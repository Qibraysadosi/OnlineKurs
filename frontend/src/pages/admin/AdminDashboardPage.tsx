import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, GraduationCap, Star, Trophy, Users, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi, getErrorMessage, queryKeys } from "@/api";
import { ErrorFallback } from "@/components/guards";
import { PageHeader } from "@/components/layout";
import { Card, CardHeader, EmptyState, Skeleton, StatCard, buttonClassName } from "@/components/ui";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatCompact, formatNumber, formatPrice, formatRating, studentsLabel } from "@/lib/utils";
import type { AdminStats } from "@/types";
import { CourseCell } from "./components/CourseCell";
import { PaymentsTable } from "./components/PaymentsTable";
import { RevenueChart } from "./components/RevenueChart";

function StatTilesSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="ok-card flex items-center gap-4 p-5 sm:p-6">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-20" />
          </div>
        </div>
      ))}
    </>
  );
}

const SKELETON_BARS = [45, 25, 30, 90, 10, 95];

function ChartSkeleton() {
  return (
    <Card>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-48" />
        </div>
        <Skeleton className="h-9 w-40 rounded-xl" />
      </div>
      <div className="flex h-[280px] items-end gap-4 px-2 pb-6" aria-hidden="true">
        {SKELETON_BARS.map((height, i) => (
          <div key={i} className="w-full" style={{ height: `${height}%` }}>
            <Skeleton className="h-full w-full rounded-b-none rounded-t-md" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function TopCoursesSkeleton() {
  return (
    <Card>
      <Skeleton className="mb-6 h-5 w-32" />
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-11 w-[72px] rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TopCourses({ courses }: { courses: AdminStats["top_courses"] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader title="Eng mashhur kurslar" description="Talabalar soni bo'yicha" />
      {courses.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<Trophy className="h-7 w-7" aria-hidden="true" />}
          title="Hali kurslar yo'q"
          description="Talabalar yozilishi bilan reyting shu yerda ko'rinadi."
        />
      ) : (
        <ol className="divide-y divide-slate-200 dark:divide-slate-800">
          {courses.map((course, index) => (
            <li key={course.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                aria-label={`${index + 1}-o'rin`}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <CourseCell
                  course={course}
                  meta={
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{studentsLabel(course.students_count)}</span>
                      <span aria-hidden="true">·</span>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                      {formatRating(course.rating_avg)}
                    </span>
                  }
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default function AdminDashboardPage() {
  useDocumentTitle("Statistika");
  const stats = useQuery({ queryKey: queryKeys.admin.stats, queryFn: adminApi.stats });

  if (stats.isError) {
    return (
      <div className="animate-in">
        <PageHeader title="Statistika" description="Platforma bo'yicha umumiy ko'rsatkichlar." />
        <ErrorFallback message={getErrorMessage(stats.error)} onRetry={() => stats.refetch()} />
      </div>
    );
  }

  const data = stats.data;

  return (
    <div className="animate-in">
      <PageHeader
        title="Statistika"
        description="Foydalanuvchilar, kurslar va daromad bo'yicha umumiy ko'rsatkichlar."
        actions={
          <Link to="/admin/payments" className={buttonClassName({ variant: "outline" })}>
            To'lovlar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />

      <section aria-label="Asosiy ko'rsatkichlar" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data ? (
          <>
            <StatCard
              label="Foydalanuvchi"
              value={formatNumber(data.users_count)}
              hint={`${formatNumber(data.students_count)} talaba · ${formatNumber(data.teachers_count)} o'qituvchi`}
              icon={<Users className="h-6 w-6" />}
              tone="primary"
            />
            <StatCard
              label="Kurslar"
              value={formatNumber(data.courses_count)}
              hint={`${formatNumber(data.published_courses_count)} tasi nashrda`}
              icon={<BookOpen className="h-6 w-6" />}
              tone="info"
            />
            <StatCard
              label="Yozilishlar"
              value={formatNumber(data.enrollments_count)}
              hint="Barcha kurslar bo'yicha"
              icon={<GraduationCap className="h-6 w-6" />}
              tone="warning"
            />
            <StatCard
              label="Jami daromad"
              value={formatCompact(data.revenue_total)}
              hint={
                data.revenue_total > 0
                  ? `${formatPrice(data.revenue_total)} · 30 kun: ${formatCompact(data.revenue_last_30_days)}`
                  : "Hali to'lovlar yo'q"
              }
              icon={<Wallet className="h-6 w-6" />}
              tone="success"
            />
          </>
        ) : (
          <StatTilesSkeleton />
        )}
      </section>

      <section aria-label="Daromad va mashhur kurslar" className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">{data ? <RevenueChart data={data.monthly_revenue} /> : <ChartSkeleton />}</div>
        <div className="min-w-0">{data ? <TopCourses courses={data.top_courses} /> : <TopCoursesSkeleton />}</div>
      </section>

      <section aria-labelledby="recent-payments-heading" className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="recent-payments-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              So'nggi to'lovlar
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Oxirgi 10 ta to'lov</p>
          </div>
          <Link to="/admin/payments" className={buttonClassName({ variant: "ghost", size: "sm" })}>
            Barchasini ko'rish
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <PaymentsTable payments={data?.recent_payments} loading={stats.isPending} />
      </section>
    </div>
  );
}
