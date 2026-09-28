import { useQuery } from "@tanstack/react-query";
import { BookOpen, Compass } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { enrollmentsApi, getErrorMessage, queryKeys } from "@/api";
import { CourseGrid } from "@/components/course";
import { ErrorFallback } from "@/components/guards";
import { PageHeader } from "@/components/layout";
import { EmptyState, Tabs, buttonClassName, type TabItem } from "@/components/ui";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type { Enrollment } from "@/types";
import { learnPathFor } from "./components/learnPath";

type Filter = "all" | "active" | "done";

function matches(enrollment: Enrollment, filter: Filter): boolean {
  if (filter === "active") return enrollment.progress_percent < 100;
  if (filter === "done") return enrollment.progress_percent >= 100;
  return true;
}

const EMPTY_COPY: Record<Filter, { title: string; description: string }> = {
  all: {
    title: "Hali kurslaringiz yo'q",
    description: "Katalogdan kurs tanlang — yozilgan kurslaringiz shu yerda ko'rinadi.",
  },
  active: {
    title: "Davom etayotgan kurslar yo'q",
    description: "Barcha kurslaringizni yakunlagansiz. Yangi kurs boshlash vaqti keldi!",
  },
  done: {
    title: "Yakunlangan kurslar yo'q",
    description: "Darslarni oxirigacha ko'rib chiqing — yakunlangan kurslar shu yerda to'planadi.",
  },
};

export default function MyCoursesPage() {
  useDocumentTitle("Kurslarim");
  const [filter, setFilter] = useState<Filter>("all");
  const enrollments = useQuery({ queryKey: queryKeys.enrollments, queryFn: enrollmentsApi.mine });

  const all = enrollments.data ?? [];
  const visible = all.filter((e) => matches(e, filter));
  const progressByCourseId = Object.fromEntries(all.map((e) => [e.course.id, e.progress_percent])) as Record<number, number>;
  const linkByCourseId = new Map(all.map((e) => [e.course.id, learnPathFor(e)]));

  const tabs: TabItem<Filter>[] = [
    { value: "all", label: "Barchasi", count: all.length },
    { value: "active", label: "Davom etayotgan", count: all.filter((e) => matches(e, "active")).length },
    { value: "done", label: "Yakunlangan", count: all.filter((e) => matches(e, "done")).length },
  ];

  const browseLink = (
    <Link to="/courses" className={buttonClassName({ variant: "gradient" })}>
      <Compass className="h-4 w-4" aria-hidden="true" />
      Kurslarni ko'rish
    </Link>
  );

  return (
    <div className="animate-in">
      <PageHeader
        title="Kurslarim"
        description={all.length > 0 ? `${all.length} ta kursga yozilgansiz` : "Siz yozilgan barcha kurslar"}
        actions={browseLink}
      >
        {all.length > 0 && (
          <div className="no-scrollbar max-w-full overflow-x-auto">
            <Tabs tabs={tabs} value={filter} onChange={setFilter} variant="pills" label="Kurslarni filtrlash" />
          </div>
        )}
      </PageHeader>

      {enrollments.isError ? (
        <ErrorFallback message={getErrorMessage(enrollments.error)} onRetry={() => enrollments.refetch()} />
      ) : (
        <CourseGrid
          courses={visible.map((e) => e.course)}
          loading={enrollments.isPending}
          skeletonCount={6}
          progressByCourseId={progressByCourseId}
          linkFor={(course) => linkByCourseId.get(course.id) ?? `/learn/${course.slug}`}
          empty={
            <EmptyState
              icon={<BookOpen className="h-7 w-7" aria-hidden="true" />}
              title={EMPTY_COPY[filter].title}
              description={EMPTY_COPY[filter].description}
              action={filter === "all" ? browseLink : undefined}
            />
          }
        />
      )}
    </div>
  );
}
