import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BookOpen, Eye, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi, getErrorMessage, queryKeys } from "@/api";
import { PriceTag, RatingStars } from "@/components/course";
import { ErrorFallback } from "@/components/guards";
import { PageHeader } from "@/components/layout";
import {
  Badge,
  Button,
  EmptyState,
  Pagination,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  TableContainer,
  TableSkeletonRows,
  Tabs,
  buttonClassName,
} from "@/components/ui";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useQueryParams } from "@/hooks/useQueryParams";
import { cn, formatNumber, lessonsLabel } from "@/lib/utils";
import type { AdminCoursesParams } from "@/types";
import { CourseCell } from "./components/CourseCell";
import { ListToolbar } from "./components/ListToolbar";
import { useDebouncedSearchParam } from "./components/useDebouncedSearchParam";

const PAGE_SIZE = 20;
const COLS = 6;
/** Slightly tighter cells so six columns fit the 1280px dashboard content width without scrolling. */
const CELL = "px-3 first:pl-4 last:pr-4";

type StatusFilter = "all" | "published" | "draft";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Barchasi" },
  { value: "published", label: "Nashrda" },
  { value: "draft", label: "Qoralama" },
];

function parseStatus(value: string): StatusFilter {
  return value === "published" || value === "draft" ? value : "all";
}

export default function AdminCoursesPage() {
  useDocumentTitle("Kurslar");
  const { get, getNumber, setMany, clear } = useQueryParams();
  const [search, setSearch] = useDebouncedSearchParam();

  const status = parseStatus(get("status"));
  const params: AdminCoursesParams = {
    q: get("q") || undefined,
    is_published: status === "all" ? undefined : status === "published",
    page: getNumber("page", 1),
    page_size: PAGE_SIZE,
  };
  const hasFilters = Boolean(params.q) || status !== "all";

  const courses = useQuery({
    queryKey: queryKeys.admin.courses(params),
    queryFn: () => adminApi.courses(params),
    placeholderData: keepPreviousData,
  });

  const data = courses.data;
  const showEmpty = data !== undefined && data.items.length === 0;

  return (
    <div className="animate-in">
      <PageHeader
        title="Kurslar"
        description="Platformadagi barcha kurslar — nashr qilinganlari ham, qoralamalari ham."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Kurslar" }]}
        actions={
          <Link to="/teacher/courses/new" className={buttonClassName({ variant: "gradient" })}>
            Yangi kurs
          </Link>
        }
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Kurs nomi bo'yicha qidirish"
        summary={data ? `${formatNumber(data.total)} ta kurs${hasFilters ? " topildi" : ""}` : undefined}
      >
        <Tabs
          variant="pills"
          label="Nashr holati"
          tabs={STATUS_TABS}
          value={status}
          onChange={(next) => setMany({ status: next === "all" ? null : next, page: null })}
        />
      </ListToolbar>

      {courses.isError ? (
        <ErrorFallback message={getErrorMessage(courses.error)} onRetry={() => courses.refetch()} />
      ) : showEmpty ? (
        <EmptyState
          icon={<BookOpen className="h-7 w-7" aria-hidden="true" />}
          title={hasFilters ? "Kurs topilmadi" : "Hali kurslar yo'q"}
          description={hasFilters ? "Qidiruv so'zini yoki holat filtrini o'zgartirib ko'ring." : "O'qituvchilar yaratgan kurslar shu yerda ko'rinadi."}
          action={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  clear();
                }}
              >
                Filtrlarni tozalash
              </Button>
            ) : (
              <Link to="/teacher/courses/new" className={buttonClassName()}>
                Yangi kurs yaratish
              </Link>
            )
          }
        />
      ) : (
        <>
          <TableContainer className={cn("transition-opacity duration-200", courses.isPlaceholderData && "opacity-60")}>
            <Table className="min-w-[860px]">
              <THead>
                <TR>
                  <TH className={CELL}>Kurs</TH>
                  <TH className={CELL} align="right">Talabalar</TH>
                  <TH className={CELL}>Baho</TH>
                  <TH className={CELL} align="right">Narx</TH>
                  <TH className={CELL}>Holat</TH>
                  <TH className={CELL} align="right">Amallar</TH>
                </TR>
              </THead>
              <TBody>
                {courses.isPending ? (
                  <TableSkeletonRows rows={8} cols={COLS} />
                ) : (
                  data?.items.map((course) => (
                    <TR key={course.id}>
                      <TD className={CELL}>
                        <CourseCell
                          course={course}
                          meta={`${course.teacher.full_name} · ${course.category?.name ?? "Kategoriyasiz"} · ${lessonsLabel(course.lessons_count)}`}
                        />
                      </TD>
                      <TD align="right" className={cn(CELL, "tabular-nums")}>
                        {formatNumber(course.students_count)}
                      </TD>
                      <TD className={CELL}>
                        <RatingStars value={course.rating_avg} showValue count={course.reviews_count} size="sm" />
                      </TD>
                      <TD align="right" className={cn(CELL, "whitespace-nowrap")}>
                        <PriceTag price={course.price} size="sm" />
                      </TD>
                      <TD className={CELL}>
                        {course.is_published ? (
                          <Badge tone="success" dot>
                            Nashrda
                          </Badge>
                        ) : (
                          <Badge tone="warning" dot>
                            Qoralama
                          </Badge>
                        )}
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
                        </div>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </TableContainer>
          {data && (
            <Pagination className="mt-5" page={data.page} pages={data.pages} total={data.total} onChange={(page) => setMany({ page })} />
          )}
        </>
      )}
    </div>
  );
}
