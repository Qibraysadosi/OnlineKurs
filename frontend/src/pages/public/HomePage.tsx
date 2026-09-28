import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, GraduationCap, LayoutGrid, Search, Sparkles, Users } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { categoriesApi, coursesApi, getErrorMessage, queryKeys } from "@/api";
import { CategoryIcon } from "@/components/course/CategoryIcon";
import { CourseGrid } from "@/components/course/CourseGrid";
import { ErrorFallback } from "@/components/guards/ErrorBoundary";
import { Container } from "@/components/layout/Container";
import { Button, buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatNumber } from "@/lib/utils";
import type { Category, CourseCard } from "@/types";
import { CtaBanner, HowItWorks, SectionHeading, Testimonials } from "./components/HomeSections";

function HeroSearch() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = value.trim();
    navigate(q ? `/courses?q=${encodeURIComponent(q)}` : "/courses");
  };
  return (
    <form onSubmit={submit} role="search" className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white/90 sm:p-1.5 sm:shadow-lg sm:shadow-primary-500/10 sm:backdrop-blur dark:sm:border-slate-800 dark:sm:bg-slate-900/80">
      <label htmlFor="hero-search" className="sr-only">
        Kurs qidirish
      </label>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id="hero-search"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Masalan: Python, Figma, IELTS…"
          className="ok-focus h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-base text-slate-900 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:border-0 sm:bg-transparent sm:focus-visible:ring-0 dark:sm:bg-transparent"
        />
      </div>
      <Button type="submit" variant="gradient" size="lg" className="sm:h-11">
        Qidirish
      </Button>
    </form>
  );
}

function StatPill({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300" aria-hidden="true">
        {icon}
      </span>
      <div className="text-left">
        <p className="text-lg font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function HeroStats({ categories, featured, loading }: { categories: Category[]; featured: CourseCard[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="mt-8 flex flex-wrap justify-center gap-3" aria-hidden="true">
        <Skeleton className="h-14 w-40 rounded-2xl" count={3} />
      </div>
    );
  }
  const coursesTotal = categories.reduce((sum, c) => sum + c.courses_count, 0);
  const studentsTotal = featured.reduce((sum, c) => sum + c.students_count, 0);
  const teachersTotal = new Set(featured.map((c) => c.teacher.id)).size;
  return (
    <dl className="mt-8 flex flex-wrap justify-center gap-3">
      <StatPill icon={<BookOpen className="h-4 w-4" />} value={`${formatNumber(coursesTotal)}+`} label="kurs" />
      <StatPill icon={<Users className="h-4 w-4" />} value={`${formatNumber(studentsTotal)}+`} label="talaba" />
      <StatPill icon={<GraduationCap className="h-4 w-4" />} value={formatNumber(teachersTotal)} label="o'qituvchi" />
    </dl>
  );
}

function CategoryChips({ categories, loading }: { categories: Category[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-hidden="true">
        <Skeleton className="h-[7.5rem] rounded-2xl" count={6} />
      </div>
    );
  }
  if (categories.length === 0) {
    return <EmptyState size="sm" icon={<LayoutGrid className="h-6 w-6" />} title="Yo'nalishlar hali qo'shilmagan" />;
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {categories.map((category) => (
        <li key={category.id}>
          <Link
            to={`/courses?category=${encodeURIComponent(category.slug)}`}
            className="ok-card ok-focus group flex h-full flex-col items-start gap-3 p-4 hover:-translate-y-0.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white dark:bg-primary-950/60 dark:text-primary-300 dark:group-hover:bg-primary-500">
              <CategoryIcon name={category.icon} className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{category.name}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{category.courses_count} ta kurs</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  useDocumentTitle("Bosh sahifa");
  const { isAuthenticated } = useAuth();
  const categoriesQuery = useQuery({ queryKey: queryKeys.categories, queryFn: categoriesApi.list });
  const featuredQuery = useQuery({ queryKey: queryKeys.courses.featured, queryFn: coursesApi.featured });

  const categories = categoriesQuery.data ?? [];
  const featured = featuredQuery.data ?? [];

  return (
    <div className="animate-in">
      <section className="relative overflow-hidden border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="ok-hero-glow absolute inset-0 -z-10" aria-hidden="true" />
        <span className="absolute -left-24 top-24 -z-10 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/10" aria-hidden="true" />
        <span className="absolute -right-24 top-10 -z-10 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/10" aria-hidden="true" />
        <Container className="py-16 text-center sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:border-primary-900 dark:bg-primary-950/60 dark:text-primary-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            O'zbek tilidagi onlayn kurslar
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-6xl">
            Kelajak kasbingizni <span className="ok-gradient-text">bugun</span> o'rganing
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 dark:text-slate-400 sm:text-lg">
            Dasturlash, dizayn, marketing va tillar bo'yicha amaliy video kurslar. O'z tezligingizda o'rganing, progressni kuzating va
            natijaga erishing.
          </p>
          <HeroSearch />
          <HeroStats categories={categories} featured={featured} loading={categoriesQuery.isPending || featuredQuery.isPending} />
        </Container>
      </section>

      <Container className="space-y-16 py-12 sm:space-y-24 sm:py-16">
        <section aria-labelledby="categories-title">
          <SectionHeading
            eyebrow="Yo'nalishlar"
            title="Nimani o'rganmoqchisiz?"
            description="Har bir yo'nalishda boshlang'ichdan yuqori darajagacha kurslar."
          />
          {categoriesQuery.isError ? (
            <ErrorFallback className="py-8" message={getErrorMessage(categoriesQuery.error)} onRetry={() => categoriesQuery.refetch()} />
          ) : (
            <CategoryChips categories={categories} loading={categoriesQuery.isPending} />
          )}
        </section>

        <section aria-labelledby="featured-title">
          <SectionHeading
            eyebrow="Tanlangan"
            title="Mashhur kurslar"
            description="Eng ko'p talaba yozilgan va yuqori baholangan kurslar."
            action={
              <Link to="/courses" className={buttonClassName({ variant: "outline" })}>
                Barcha kurslar
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
          {featuredQuery.isError ? (
            <ErrorFallback className="py-8" message={getErrorMessage(featuredQuery.error)} onRetry={() => featuredQuery.refetch()} />
          ) : (
            <CourseGrid
              courses={featured}
              loading={featuredQuery.isPending}
              skeletonCount={6}
              empty={
                <EmptyState
                  icon={<BookOpen className="h-7 w-7" />}
                  title="Hali kurslar yo'q"
                  description="Tez orada yangi kurslar qo'shiladi. Katalogni kuzatib boring."
                  action={
                    <Link to="/courses" className={buttonClassName()}>
                      Katalogga o'tish
                    </Link>
                  }
                />
              }
            />
          )}
        </section>

        <HowItWorks />
        <Testimonials />
        <CtaBanner isAuthenticated={isAuthenticated} />
      </Container>
    </div>
  );
}
