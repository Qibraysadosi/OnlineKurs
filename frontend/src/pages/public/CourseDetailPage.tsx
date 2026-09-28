import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Globe,
  Layers,
  ListChecks,
  Pencil,
  Play,
  PlayCircle,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { coursesApi, getErrorMessage, queryKeys } from "@/api";
import { CourseCover } from "@/components/course/CourseCover";
import { CurriculumAccordion } from "@/components/course/CurriculumAccordion";
import { LevelBadge } from "@/components/course/LevelBadge";
import { PriceTag } from "@/components/course/PriceTag";
import { RatingStars } from "@/components/course/RatingStars";
import { ErrorFallback } from "@/components/guards/ErrorBoundary";
import { Container } from "@/components/layout/Container";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useToast } from "@/hooks/useToast";
import { formatDate, formatDuration, formatNumber, languageLabel, levelLabel } from "@/lib/utils";
import type { CourseDetail, LessonOut } from "@/types";
import { CourseDetailSkeleton } from "./components/CourseDetailSkeleton";
import { LessonPreviewModal } from "./components/LessonPreviewModal";
import { ReviewsSection } from "./components/ReviewsSection";

const LOCKED_LESSON_MESSAGE = "Bu darsni ko'rish uchun kursni sotib oling";

const JUMP_LINKS = [
  { href: "#overview", label: "Umumiy" },
  { href: "#curriculum", label: "Dastur" },
  { href: "#teacher", label: "O'qituvchi" },
  { href: "#reviews", label: "Sharhlar" },
] as const;

function SectionCard({ id, title, icon, children, className }: { id: string; title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={className}>
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300" aria-hidden="true">
            {icon}
          </span>
          <h2 id={`${id}-title`} className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
            {title}
          </h2>
        </div>
        {children}
      </Card>
    </section>
  );
}

function HeroMeta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-300">
      <span className="text-slate-400" aria-hidden="true">
        {icon}
      </span>
      {children}
    </span>
  );
}

function IncludesRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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

interface PurchaseCardProps {
  course: CourseDetail;
  previewLesson: LessonOut | null;
  onPreview: (lesson: LessonOut) => void;
  onEnroll: () => void;
  enrolling: boolean;
}

function PurchaseCard({ course, previewLesson, onPreview, onEnroll, enrolling }: PurchaseCardProps) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const isOwner = Boolean(user) && (user?.id === course.teacher.id || isAdmin);
  const loginNext = `/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`;
  const progress = course.progress_percent;
  const sectionsCount = course.sections.length;

  let cta: ReactNode;
  if (isOwner) {
    cta = (
      <div className="space-y-2">
        <Link to={`/teacher/courses/${course.id}/edit`} className={buttonClassName({ variant: "gradient", size: "lg", fullWidth: true })}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Tahrirlash
        </Link>
        <Link to={`/learn/${course.slug}`} className={buttonClassName({ variant: "outline", size: "lg", fullWidth: true })}>
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          Darslarni ko'rish
        </Link>
      </div>
    );
  } else if (course.has_access || course.is_enrolled) {
    cta = (
      <div className="space-y-3">
        {progress !== null && <ProgressBar value={progress} showLabel label="Kurs progressi" />}
        <Link to={`/learn/${course.slug}`} className={buttonClassName({ variant: "gradient", size: "lg", fullWidth: true })}>
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          {progress ? "Davom etish" : "O'rganishni boshlash"}
        </Link>
      </div>
    );
  } else if (!isAuthenticated) {
    cta = (
      <Link to={loginNext} className={buttonClassName({ variant: "gradient", size: "lg", fullWidth: true })}>
        {course.price <= 0 ? <Sparkles className="h-4 w-4" aria-hidden="true" /> : <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
        {course.price <= 0 ? "Kursga yozilish" : "Sotib olish"}
      </Link>
    );
  } else if (course.price <= 0) {
    cta = (
      <Button variant="gradient" size="lg" fullWidth loading={enrolling} onClick={onEnroll} leftIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}>
        Kursga yozilish
      </Button>
    );
  } else {
    cta = (
      <Link to={`/checkout/${course.slug}`} className={buttonClassName({ variant: "gradient", size: "lg", fullWidth: true })}>
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        Sotib olish
      </Link>
    );
  }

  return (
    <div className="ok-card overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/40">
      <div className="group relative">
        <CourseCover course={course} />
        {previewLesson && !course.has_access && (
          <button
            type="button"
            onClick={() => onPreview(previewLesson)}
            className="ok-focus absolute inset-0 flex items-center justify-center bg-slate-950/30 transition-colors hover:bg-slate-950/45"
            aria-label={`Bepul darsni ko'rish: ${previewLesson.title}`}
          >
            <span className="flex items-center gap-2 rounded-full bg-white/95 py-2 pl-3 pr-4 text-sm font-semibold text-slate-900 shadow-lg transition-transform group-hover:scale-105">
              <span className="ok-gradient-bg flex h-7 w-7 items-center justify-center rounded-full text-white">
                <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" aria-hidden="true" />
              </span>
              Bepul darsni ko'rish
            </span>
          </button>
        )}
      </div>
      <div className="space-y-5 p-5">
        <div className="flex items-end justify-between gap-3">
          <PriceTag price={course.price} size="lg" />
          {course.price > 0 && <span className="text-xs text-slate-500 dark:text-slate-400">Bir martalik to'lov</span>}
        </div>
        {cta}
        {!isOwner && !course.has_access && course.price > 0 && (
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">Umrbod kirish · Barcha darslar va materiallar</p>
        )}
        <ul className="space-y-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <IncludesRow icon={<PlayCircle className="h-4 w-4" />} label="Darslar" value={`${course.lessons_count} ta`} />
          <IncludesRow icon={<Layers className="h-4 w-4" />} label="Bo'limlar" value={`${sectionsCount} ta`} />
          {course.duration_minutes > 0 && <IncludesRow icon={<Clock className="h-4 w-4" />} label="Davomiyligi" value={formatDuration(course.duration_minutes)} />}
          <IncludesRow icon={<BarChart3 className="h-4 w-4" />} label="Daraja" value={levelLabel(course.level)} />
          <IncludesRow icon={<Globe className="h-4 w-4" />} label="Til" value={languageLabel(course.language)} />
        </ul>
      </div>
    </div>
  );
}

function CourseNotFound() {
  return (
    <Container className="py-16 animate-in">
      <EmptyState
        icon={<BookOpen className="h-7 w-7" />}
        title="Kurs topilmadi"
        description="Bu kurs mavjud emas, o'chirilgan yoki hali nashr qilinmagan."
        action={
          <Link to="/courses" className={buttonClassName()}>
            Barcha kurslar
          </Link>
        }
      />
    </Container>
  );
}

export default function CourseDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const purchaseRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<LessonOut | null>(null);

  const courseQuery = useQuery({ queryKey: queryKeys.course(slug), queryFn: () => coursesApi.get(slug), enabled: Boolean(slug) });
  useDocumentTitle(courseQuery.data?.title ?? "Kurs");

  const enroll = useMutation({
    mutationFn: (courseId: number) => coursesApi.enroll(courseId),
    onSuccess: () => {
      toast.success("Kursga yozildingiz", { description: "Birinchi darsni hoziroq boshlashingiz mumkin." });
      queryClient.invalidateQueries({ queryKey: queryKeys.course(slug) });
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      navigate(`/learn/${slug}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (courseQuery.isPending) return <CourseDetailSkeleton />;
  if (courseQuery.isError) {
    if (isAxiosError(courseQuery.error) && courseQuery.error.response?.status === 404) return <CourseNotFound />;
    return <ErrorFallback message={getErrorMessage(courseQuery.error)} onRetry={() => courseQuery.refetch()} />;
  }

  const course = courseQuery.data;
  const previewLesson = course.sections.flatMap((s) => s.lessons).find((l) => l.is_free_preview) ?? null;
  const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);

  const openLesson = (lesson: LessonOut) => {
    if (course.has_access) {
      navigate(`/learn/${course.slug}?lesson=${lesson.id}`);
      return;
    }
    if (lesson.is_free_preview) {
      setPreview(lesson);
      return;
    }
    toast.info(LOCKED_LESSON_MESSAGE);
    purchaseRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="animate-in">
      <section className="relative overflow-hidden border-b border-slate-800 bg-slate-900 text-white dark:bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 dark:from-indigo-950/60 dark:via-slate-950 dark:to-slate-950" aria-hidden="true" />
        <span className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" aria-hidden="true" />
        <span className="absolute right-1/3 top-0 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" aria-hidden="true" />
        <Container className="relative py-10 sm:py-14 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          <div className="min-w-0">
            <nav aria-label="Yo'l" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-slate-400">
              <Link to="/" className="ok-focus rounded transition hover:text-white">
                Bosh sahifa
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <Link to="/courses" className="ok-focus rounded transition hover:text-white">
                Kurslar
              </Link>
              {course.category && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  <Link to={`/courses?category=${encodeURIComponent(course.category.slug)}`} className="ok-focus rounded transition hover:text-white">
                    {course.category.name}
                  </Link>
                </>
              )}
            </nav>

            {!course.is_published && (
              <Alert tone="warning" className="mb-4" title="Bu kurs hali nashr qilinmagan">
                Uni faqat siz va administratorlar ko'ra oladi.
              </Alert>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {course.category && (
                <Badge tone="primary" className="bg-primary-500/15 text-primary-200 ring-primary-400/30">
                  {course.category.name}
                </Badge>
              )}
              <LevelBadge level={course.level} />
              {course.price <= 0 && <Badge tone="success">Bepul</Badge>}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.6rem] lg:leading-[1.15]">{course.title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">{course.short_description}</p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="inline-flex items-center gap-2">
                <RatingStars value={course.rating_avg} size="md" />
                <span className="text-sm font-semibold text-amber-300">{course.rating_avg.toFixed(1)}</span>
                <span className="text-sm text-slate-400">({formatNumber(course.reviews_count)} sharh)</span>
              </span>
              <HeroMeta icon={<Users className="h-4 w-4" />}>{formatNumber(course.students_count)} talaba</HeroMeta>
              <HeroMeta icon={<PlayCircle className="h-4 w-4" />}>{course.lessons_count} ta dars</HeroMeta>
              <HeroMeta icon={<CalendarDays className="h-4 w-4" />}>Yangilangan: {formatDate(course.updated_at)}</HeroMeta>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Avatar src={course.teacher.avatar_url} name={course.teacher.full_name} size="md" className="ring-slate-700" />
              <div className="min-w-0">
                <p className="text-xs text-slate-400">O'qituvchi</p>
                <a href="#teacher" className="ok-focus block truncate rounded text-sm font-semibold text-white hover:underline">
                  {course.teacher.full_name}
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="flex flex-col gap-8 py-8 sm:py-12 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
        <aside ref={purchaseRef} className="order-first lg:sticky lg:top-24 lg:order-last lg:z-10 lg:-mt-56" aria-label="Kursga yozilish">
          <PurchaseCard course={course} previewLesson={previewLesson} onPreview={setPreview} onEnroll={() => enroll.mutate(course.id)} enrolling={enroll.isPending} />
        </aside>

        <div className="min-w-0 space-y-8">
          <nav aria-label="Sahifa bo'limlari" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4 dark:border-slate-800 sm:mx-0 sm:px-0">
            {JUMP_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="ok-focus -mb-px shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div id="overview" className="scroll-mt-24 space-y-8">
            {course.what_you_learn.length > 0 && (
              <SectionCard id="what-you-learn" title="Nimalarni o'rganasiz" icon={<ListChecks className="h-5 w-5" />}>
                <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {course.what_you_learn.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            <SectionCard id="description" title="Kurs haqida" icon={<BookOpen className="h-5 w-5" />}>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-[15px]">{course.description}</p>
            </SectionCard>
          </div>

          <section id="curriculum" aria-labelledby="curriculum-title" className="scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 id="curriculum-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
                Kurs dasturi
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {course.sections.length} ta bo'lim · {totalLessons} ta dars
                {course.duration_minutes > 0 && ` · ${formatDuration(course.duration_minutes)}`}
              </p>
            </div>
            {course.sections.length === 0 ? (
              <EmptyState size="sm" icon={<Layers className="h-6 w-6" />} title="Kurs dasturi hali qo'shilmagan" description="O'qituvchi darslarni tez orada joylashtiradi." />
            ) : (
              <CurriculumAccordion sections={course.sections} onSelect={openLesson} defaultOpen="first" />
            )}
          </section>

          {course.requirements.length > 0 && (
            <SectionCard id="requirements" title="Talablar" icon={<Sparkles className="h-5 w-5" />}>
              <ul className="space-y-2.5">
                {course.requirements.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <SectionCard id="teacher" title="O'qituvchi" icon={<Users className="h-5 w-5" />} className="scroll-mt-24">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Avatar src={course.teacher.avatar_url} name={course.teacher.full_name} size="xl" />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{course.teacher.full_name}</p>
                {course.teacher.bio ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{course.teacher.bio}</p>
                ) : (
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">O'qituvchi hali o'zi haqida ma'lumot qo'shmagan.</p>
                )}
              </div>
            </div>
          </SectionCard>

          <ReviewsSection course={course} />
        </div>
      </Container>

      <LessonPreviewModal lesson={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
