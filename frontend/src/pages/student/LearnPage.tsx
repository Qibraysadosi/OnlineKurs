import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowLeft, BookOpen, ListVideo, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { coursesApi, getErrorMessage, lessonsApi, queryKeys } from "@/api";
import { ErrorFallback } from "@/components/guards";
import { EmptyState, IconButton, ProgressBar, buttonClassName } from "@/components/ui";
import { useDialogBehaviour } from "@/hooks/useDialogBehaviour";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useToast } from "@/hooks/useToast";
import { clampPercent } from "@/lib/utils";
import type { LessonOut, SectionOut } from "@/types";
import { LearnSidebar } from "./components/LearnSidebar";
import { LearnSkeleton } from "./components/LearnSkeleton";
import { LessonContent } from "./components/LessonContent";

const NO_ACCESS_MESSAGE = "Bu kursni ko'rish uchun avval unga yoziling";

interface FlatLesson {
  lesson: LessonOut;
  section: SectionOut;
}

function pickDefault(lessons: FlatLesson[]): FlatLesson | null {
  return lessons.find((l) => !l.lesson.is_completed && (l.lesson.has_access || l.lesson.is_free_preview)) ?? lessons[0] ?? null;
}

function CourseNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        icon={<BookOpen className="h-7 w-7" aria-hidden="true" />}
        title="Kurs topilmadi"
        description="Bu kurs mavjud emas, o'chirilgan yoki hali nashr qilinmagan."
        action={
          <Link to="/my-courses" className={buttonClassName()}>
            Kurslarim
          </Link>
        }
        className="w-full max-w-lg"
      />
    </div>
  );
}

export default function LearnPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { getNumber, set } = useQueryParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeDrawer = () => setDrawerOpen(false);
  const drawerVisible = drawerOpen && !isDesktop;
  useLockBodyScroll(drawerVisible);
  useDialogBehaviour(drawerVisible, closeDrawer, drawerRef);

  const requestedLessonId = getNumber("lesson", 0);

  const courseQuery = useQuery({ queryKey: queryKeys.course(slug), queryFn: () => coursesApi.get(slug), enabled: Boolean(slug) });
  const course = courseQuery.data;
  const courseId = course?.id ?? 0;
  const hasAccess = Boolean(course?.has_access);

  const progressQuery = useQuery({
    queryKey: queryKeys.progress(courseId),
    queryFn: () => coursesApi.progress(courseId),
    enabled: courseId > 0 && hasAccess,
  });

  const lessons = useMemo<FlatLesson[]>(
    () => course?.sections.flatMap((section) => section.lessons.map((lesson) => ({ lesson, section }))) ?? [],
    [course],
  );
  const currentIndex = lessons.findIndex((l) => l.lesson.id === requestedLessonId);
  const current = currentIndex >= 0 ? lessons[currentIndex]! : pickDefault(lessons);
  const flatIndex = current ? lessons.findIndex((l) => l.lesson.id === current.lesson.id) : -1;
  const prev = flatIndex > 0 ? lessons[flatIndex - 1]!.lesson : null;
  const next = flatIndex >= 0 && flatIndex < lessons.length - 1 ? lessons[flatIndex + 1]!.lesson : null;

  useDocumentTitle(current ? current.lesson.title : (course?.title ?? "Dars"));

  // Enforce access on the client: the API already hides video URLs, this just gives a friendly redirect.
  // Only settled data counts (a refetch right after enrolling still carries the stale anonymous
  // payload) and the ref makes sure we redirect - and toast - exactly once.
  const redirected = useRef(false);
  useEffect(() => {
    if (course && !course.has_access && !courseQuery.isFetching && !redirected.current) {
      redirected.current = true;
      toast.error(NO_ACCESS_MESSAGE);
      navigate(`/courses/${course.slug}`, { replace: true });
    }
  }, [course, courseQuery.isFetching, navigate, toast]);

  // Pin the resolved default lesson into the URL so completing it does not silently jump to the next one.
  useEffect(() => {
    if (course && course.has_access && current && requestedLessonId !== current.lesson.id) {
      set("lesson", current.lesson.id, { replace: true });
    }
  }, [course, current, requestedLessonId, set]);

  const invalidateProgress = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.course(slug) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.progress(courseId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.enrollments });
  };

  const toggle = useMutation({
    mutationFn: ({ lesson }: { lesson: LessonOut }) => (lesson.is_completed ? lessonsApi.uncomplete(lesson.id) : lessonsApi.complete(lesson.id)),
    onSuccess: (result, { lesson }) => {
      if (lesson.is_completed) {
        toast.info("Dars yakunlanmagan deb belgilandi");
      } else if (result.progress_percent >= 100) {
        toast.success("Tabriklaymiz! Kursni to'liq yakunladingiz", { description: "Kurs sahifasida sharh qoldirishni unutmang." });
      } else {
        toast.success("Dars yakunlandi", { description: `${result.completed_lessons}/${result.total_lessons} dars bajarildi` });
      }
      invalidateProgress();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const goTo = (lesson: LessonOut) => {
    set("lesson", lesson.id, { replace: false });
    setDrawerOpen(false);
  };

  if (courseQuery.isPending) return <LearnSkeleton />;
  if (courseQuery.isError) {
    if (isAxiosError(courseQuery.error) && courseQuery.error.response?.status === 404) return <CourseNotFound />;
    return <ErrorFallback message={getErrorMessage(courseQuery.error)} onRetry={() => courseQuery.refetch()} />;
  }
  if (!course || !course.has_access) return null;

  const progress = progressQuery.data ?? {
    progress_percent: clampPercent(course.progress_percent),
    completed_lessons: lessons.filter((l) => l.lesson.is_completed).length,
    total_lessons: lessons.length,
  };

  const sidebar = <LearnSidebar sections={course.sections} activeLessonId={current?.lesson.id ?? null} progress={progress} onSelect={goTo} />;

  return (
    <div className="flex min-h-0 flex-1 flex-col animate-in">
      <div className="z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            to={`/courses/${course.slug}`}
            aria-label="Kurs sahifasiga qaytish"
            className={buttonClassName({ variant: "ghost", size: "sm", className: "h-9 w-9 shrink-0 px-0" })}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{course.title}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{course.teacher.full_name}</p>
          </div>
          <ProgressBar value={progress.progress_percent} showLabel label="Kurs progressi" className="hidden w-48 shrink-0 sm:flex" />
          <span className="hidden shrink-0 text-xs tabular-nums text-slate-500 sm:inline dark:text-slate-400">
            {progress.completed_lessons}/{progress.total_lessons} dars
          </span>
          {!isDesktop && (
            <IconButton aria-label="Darslar ro'yxati" variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
              <ListVideo className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          )}
        </div>
        <ProgressBar value={progress.progress_percent} size="xs" className="sm:hidden [&>div]:rounded-none" label="Kurs progressi" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
            {current ? (
              <LessonContent
                course={course}
                lesson={current.lesson}
                section={current.section}
                index={flatIndex + 1}
                total={lessons.length}
                prev={prev}
                next={next}
                toggling={toggle.isPending}
                onToggleComplete={() => toggle.mutate({ lesson: current.lesson })}
                onNavigate={goTo}
                onEnded={() => {
                  if (!current.lesson.is_completed && !toggle.isPending) toggle.mutate({ lesson: current.lesson });
                }}
              />
            ) : (
              <EmptyState
                icon={<BookOpen className="h-7 w-7" aria-hidden="true" />}
                title="Bu kursda hali darslar yo'q"
                description="O'qituvchi darslarni qo'shishi bilan ular shu yerda paydo bo'ladi."
                action={
                  <Link to={`/courses/${course.slug}`} className={buttonClassName({ variant: "outline" })}>
                    Kurs sahifasi
                  </Link>
                }
              />
            )}
          </div>
        </div>

        {isDesktop && (
          <aside
            aria-label="Kurs dasturi"
            className="min-h-0 w-[360px] shrink-0 overflow-y-auto border-l border-slate-200 bg-slate-50/60 p-4 xl:w-[400px] dark:border-slate-800 dark:bg-slate-950/40"
          >
            {sidebar}
          </aside>
        )}
      </div>

      {drawerVisible && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Kurs dasturi">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={closeDrawer} aria-hidden="true" />
          <div
            ref={drawerRef}
            tabIndex={-1}
            className="ok-focus absolute inset-y-0 right-0 flex w-[90%] max-w-sm flex-col bg-white shadow-xl animate-in-right dark:bg-slate-950"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Darslar</p>
              <IconButton aria-label="Yopish" size="sm" onClick={closeDrawer}>
                <X className="h-5 w-5" aria-hidden="true" />
              </IconButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">{sidebar}</div>
          </div>
        </div>
      )}
    </div>
  );
}
