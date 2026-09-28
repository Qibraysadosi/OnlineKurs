import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BookOpen, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { categoriesApi, coursesApi, getErrorMessage, queryKeys } from "@/api";
import { CourseGrid } from "@/components/course/CourseGrid";
import { ErrorFallback } from "@/components/guards/ErrorBoundary";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useQueryParams } from "@/hooks/useQueryParams";
import { cn, LEVEL_LABELS } from "@/lib/utils";
import type { CourseLevel, CourseListParams, CourseSort, PriceFilter } from "@/types";
import { CourseFilters, PRICE_LABELS, type FilterValues } from "./components/CourseFilters";

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 400;

const SORT_OPTIONS: { value: CourseSort; label: string }[] = [
  { value: "newest", label: "Eng yangi" },
  { value: "popular", label: "Eng mashhur" },
  { value: "rating", label: "Reyting bo'yicha" },
  { value: "price_asc", label: "Arzondan qimmatga" },
  { value: "price_desc", label: "Qimmatdan arzonga" },
];

const LEVELS = Object.keys(LEVEL_LABELS) as CourseLevel[];
const PRICES = Object.keys(PRICE_LABELS) as PriceFilter[];
const SORTS = SORT_OPTIONS.map((o) => o.value);

function parseLevel(raw: string): CourseLevel | "" {
  return (LEVELS as string[]).includes(raw) ? (raw as CourseLevel) : "";
}

function parsePrice(raw: string): PriceFilter | "" {
  return (PRICES as string[]).includes(raw) ? (raw as PriceFilter) : "";
}

function parseSort(raw: string): CourseSort {
  return (SORTS as string[]).includes(raw) ? (raw as CourseSort) : "newest";
}

interface ActiveChip {
  key: keyof FilterValues | "q";
  label: string;
}

function ActiveFilterChips({ chips, onRemove, onClear }: { chips: ActiveChip[]; onRemove: (key: ActiveChip["key"]) => void; onClear: () => void }) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Faol filtrlar">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.key)}
          className="ok-focus inline-flex items-center gap-1.5 rounded-full bg-primary-50 py-1 pl-3 pr-2 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-200 transition hover:bg-primary-100 dark:bg-primary-950/60 dark:text-primary-300 dark:ring-primary-900 dark:hover:bg-primary-950"
          aria-label={`${chip.label} filtrini olib tashlash`}
        >
          {chip.label}
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="ok-focus rounded px-1 text-xs font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        Tozalash
      </button>
    </div>
  );
}

export default function CoursesPage() {
  useDocumentTitle("Kurslar");
  const { get, getNumber, setMany, clear } = useQueryParams();

  const urlQ = get("q");
  const filters: FilterValues = { category: get("category"), level: parseLevel(get("level")), price: parsePrice(get("price")) };
  const sort = parseSort(get("sort"));
  const page = Math.max(1, Math.floor(getNumber("page", 1)));

  const params: CourseListParams = useMemo(
    () => ({
      q: urlQ.trim() || undefined,
      category: filters.category || undefined,
      level: filters.level || undefined,
      price: filters.price || undefined,
      sort,
      page,
      page_size: PAGE_SIZE,
    }),
    [urlQ, filters.category, filters.level, filters.price, sort, page],
  );

  const categoriesQuery = useQuery({ queryKey: queryKeys.categories, queryFn: categoriesApi.list });
  const listQuery = useQuery({
    queryKey: queryKeys.courses.list(params),
    queryFn: () => coursesApi.list(params),
    placeholderData: keepPreviousData,
  });

  // Search box: local text, committed to the URL after a pause or on submit.
  const [search, setSearch] = useState(urlQ);
  const timer = useRef<number>();
  useEffect(() => {
    setSearch(urlQ);
  }, [urlQ]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const commitSearch = (value: string) => {
    window.clearTimeout(timer.current);
    setMany({ q: value.trim(), page: null });
  };
  const onSearchChange = (value: string) => {
    setSearch(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMany({ q: value.trim(), page: null }), SEARCH_DEBOUNCE_MS);
  };
  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    commitSearch(search);
  };

  const applyFilters = (patch: Partial<FilterValues>) => setMany({ ...patch, page: null });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const activeFilterCount = [filters.category, filters.level, filters.price].filter(Boolean).length;

  const categories = categoriesQuery.data ?? [];
  const chips: ActiveChip[] = [];
  if (urlQ.trim()) chips.push({ key: "q", label: `“${urlQ.trim()}”` });
  if (filters.category) {
    const name = categories.find((c) => c.slug === filters.category)?.name ?? filters.category;
    chips.push({ key: "category", label: name });
  }
  if (filters.level) chips.push({ key: "level", label: LEVEL_LABELS[filters.level] });
  if (filters.price) chips.push({ key: "price", label: PRICE_LABELS[filters.price] });

  const removeChip = (key: ActiveChip["key"]) => {
    if (key === "q") {
      window.clearTimeout(timer.current);
      setSearch("");
    }
    setMany({ [key]: null, page: null });
  };
  const clearAll = () => {
    window.clearTimeout(timer.current);
    setSearch("");
    clear();
  };

  const data = listQuery.data;
  const isRefreshing = listQuery.isFetching && listQuery.isPlaceholderData;

  return (
    <Container className="py-8 animate-in sm:py-12">
      <PageHeader
        title="Barcha kurslar"
        description="Yo'nalish, daraja va narx bo'yicha filtrlab, o'zingizga mos kursni toping."
      />

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Filtrlar">
          <div className="ok-card sticky top-24 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Filtrlar</h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => setMany({ category: null, level: null, price: null, page: null })}
                  className="ok-focus rounded text-xs font-medium text-primary-600 transition hover:text-primary-700 dark:text-primary-300"
                >
                  Tozalash
                </button>
              )}
            </div>
            <CourseFilters categories={categories} categoriesLoading={categoriesQuery.isPending} values={filters} onChange={applyFilters} />
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <form onSubmit={onSearchSubmit} role="search" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              label="Qidiruv"
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Kurs nomi yoki mavzu…"
              leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
              containerClassName="flex-1"
              autoComplete="off"
            />
            <div className="flex gap-3">
              <Select
                label="Saralash"
                value={sort}
                onChange={(e) => setMany({ sort: e.target.value === "newest" ? null : e.target.value, page: null })}
                options={SORT_OPTIONS}
                containerClassName="flex-1 sm:w-52 sm:flex-none"
              />
              <Button
                type="button"
                variant="outline"
                className="mt-auto lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}
                leftIcon={<SlidersHorizontal className="h-4 w-4" aria-hidden="true" />}
                aria-haspopup="dialog"
              >
                Filtr
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-[11px] leading-none text-white">{activeFilterCount}</span>
                )}
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
              {listQuery.isPending ? (
                <Skeleton className="inline-block h-4 w-32 align-middle" />
              ) : data ? (
                <>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{data.total}</span> ta kurs topildi
                </>
              ) : null}
            </div>
            <ActiveFilterChips chips={chips} onRemove={removeChip} onClear={clearAll} />
          </div>

          {listQuery.isError ? (
            <ErrorFallback message={getErrorMessage(listQuery.error)} onRetry={() => listQuery.refetch()} />
          ) : (
            <div className={cn("transition-opacity duration-200", isRefreshing && "opacity-60")} aria-busy={isRefreshing}>
              <CourseGrid
                courses={data?.items ?? []}
                loading={listQuery.isPending}
                skeletonCount={6}
                empty={
                  <EmptyState
                    icon={<BookOpen className="h-7 w-7" />}
                    title="Kurslar topilmadi"
                    description={
                      chips.length > 0
                        ? "Filtrlar yoki qidiruv so'zini o'zgartirib ko'ring."
                        : "Hozircha kurslar mavjud emas. Tez orada yangi kurslar qo'shiladi."
                    }
                    action={chips.length > 0 ? <Button variant="outline" onClick={clearAll}>Filtrlarni tozalash</Button> : undefined}
                  />
                }
              />
            </div>
          )}

          {data && data.pages > 1 && (
            <div className="pt-2">
              <Pagination page={data.page} pages={data.pages} total={data.total} onChange={(p) => setMany({ page: p === 1 ? null : p })} />
            </div>
          )}
        </div>
      </div>

      <Modal
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filtrlar"
        description={activeFilterCount > 0 ? `${activeFilterCount} ta filtr tanlangan` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMany({ category: null, level: null, price: null, page: null })} disabled={activeFilterCount === 0}>
              Tozalash
            </Button>
            <Button onClick={() => setMobileFiltersOpen(false)}>
              {data ? `Ko'rish (${data.total})` : "Ko'rish"}
            </Button>
          </>
        }
      >
        <CourseFilters categories={categories} categoriesLoading={categoriesQuery.isPending} values={filters} onChange={applyFilters} />
      </Modal>
    </Container>
  );
}
