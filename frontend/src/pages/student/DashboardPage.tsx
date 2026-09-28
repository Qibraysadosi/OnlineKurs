import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CheckCircle2, Compass, GraduationCap, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { coursesApi, enrollmentsApi, getErrorMessage, queryKeys } from "@/api";
import { CourseGrid } from "@/components/course";
import { ErrorFallback } from "@/components/guards";
import { PageHeader } from "@/components/layout";
import { EmptyState, StatCard, buttonClassName } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { clampPercent, formatNumber } from "@/lib/utils";
import type { Enrollment } from "@/types";
import { EnrollmentRow, EnrollmentRowSkeleton } from "./components/EnrollmentRow";
import { SectionHeading } from "./components/SectionHeading";
import { StatTilesSkeleton } from "./components/StatTilesSkeleton";

const CONTINUE_LIMIT = 3;
const RECOMMENDED_LIMIT = 3;

function firstName(fullName: string | undefined): string {
  return fullName?.trim().split(/\s+/)[0] ?? "";
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Xayrli tun";
  if (hour < 12) return "Xayrli tong";
  if (hour < 18) return "Xayrli kun";
  return "Xayrli kech";
}

interface DashboardStats {
  enrolled: number;
  completedLessons: number;
  averageProgress: number;
  completedCourses: number;
}

function summarize(enrollments: Enrollment[]): DashboardStats {
  const enrolled = enrollments.length;
  const completedLessons = enrollments.reduce((sum, e) => sum + e.completed_lessons, 0);
  const completedCourses = enrollments.filter((e) => e.progress_percent >= 100).length;
  const averageProgress = enrolled === 0 ? 0 : clampPercent(enrollments.reduce((sum, e) => sum + e.progress_percent, 0) / enrolled);
  return { enrolled, completedLessons, averageProgress, completedCourses };
}

export default function DashboardPage() {
  useDocumentTitle("Boshqaruv paneli");
  const { user } = useAuth();

  const enrollments = useQuery({ queryKey: queryKeys.enrollments, queryFn: enrollmentsApi.mine });
  const featured = useQuery({ queryKey: queryKeys.courses.featured, queryFn: coursesApi.featured });

  const stats = enrollments.data ? summarize(enrollments.data) : null;
  const inProgress = enrollments.data?.filter((e) => e.progress_percent < 100) ?? [];
  const continueList = (inProgress.length > 0 ? inProgress : (enrollments.data ?? [])).slice(0, CONTINUE_LIMIT);
  const enrolledIds = new Set(enrollments.data?.map((e) => e.course.id) ?? []);
  const recommended = (featured.data ?? []).filter((c) => !enrolledIds.has(c.id)).slice(0, RECOMMENDED_LIMIT);

  const browseLink = (
    <Link to="/courses" className={buttonClassName({ variant: "gradient" })}>
      <Compass className="h-4 w-4" aria-hidden="true" />
      Kurslarni ko'rish
    </Link>
  );

  return (
    <div className="animate-in">
      <PageHeader
        title={`${greeting()}, ${firstName(user?.full_name)}!`}
        description="O'rganishni to'xtatmang — bugun ham bitta dars oldinga."
        actions={browseLink}
      />

      <section aria-label="Statistika" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {enrollments.isPending ? (
          <StatTilesSkeleton />
        ) : enrollments.isError ? (
          <ErrorFallback
            className="rounded-2xl border border-dashed border-rose-200 px-4 py-8 sm:col-span-2 xl:col-span-4 dark:border-rose-900"
            message={getErrorMessage(enrollments.error)}
            onRetry={() => enrollments.refetch()}
          />
        ) : (
          stats && (
            <>
              <StatCard label="Kurslarim" value={formatNumber(stats.enrolled)} hint="yozilgan kurslar" icon={<BookOpen className="h-6 w-6" />} tone="primary" />
              <StatCard
                label="Darslar"
                value={formatNumber(stats.completedLessons)}
                hint="yakunlangan darslar"
                icon={<CheckCircle2 className="h-6 w-6" />}
                tone="success"
              />
              <StatCard
                label="Progress"
                value={`${stats.averageProgress}%`}
                hint={stats.enrolled > 0 ? "o'rtacha, barcha kurslar" : "hali kurslar yo'q"}
                icon={<TrendingUp className="h-6 w-6" />}
                tone="info"
              />
              <StatCard
                label="Tugatilgan"
                value={formatNumber(stats.completedCourses)}
                hint="to'liq o'tilgan kurslar"
                icon={<GraduationCap className="h-6 w-6" />}
                tone="warning"
              />
            </>
          )
        )}
      </section>

      <section aria-labelledby="continue-heading" className="mt-8">
        <SectionHeading
          id="continue-heading"
          title="Davom ettirish"
          description="Oxirgi faol kurslaringiz"
          action={
            enrollments.data && enrollments.data.length > 0 ? (
              <Link to="/my-courses" className={buttonClassName({ variant: "ghost", size: "sm" })}>
                Barchasi
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : undefined
          }
        />
        {enrollments.isPending ? (
          <div className="space-y-4">
            <EnrollmentRowSkeleton />
            <EnrollmentRowSkeleton />
          </div>
        ) : enrollments.isError ? null : continueList.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-7 w-7" aria-hidden="true" />}
            title="Hali kurslarga yozilmagansiz"
            description="Katalogdan o'zingizga yoqqan kursni tanlang — bepul kurslarga bir zumda yozilishingiz mumkin."
            action={browseLink}
          />
        ) : (
          <div className="space-y-4">
            {continueList.map((enrollment) => (
              <EnrollmentRow key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </section>

      {(featured.isPending || recommended.length > 0) && (
        <section aria-labelledby="recommended-heading" className="mt-10">
          <SectionHeading
            id="recommended-heading"
            title="Siz uchun tavsiyalar"
            description="Eng mashhur kurslar orasidan tanlab oling"
            action={
              <Link to="/courses?sort=popular" className={buttonClassName({ variant: "ghost", size: "sm" })}>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Ko'proq
              </Link>
            }
          />
          <CourseGrid courses={recommended} loading={featured.isPending} skeletonCount={RECOMMENDED_LIMIT} />
        </section>
      )}
    </div>
  );
}
