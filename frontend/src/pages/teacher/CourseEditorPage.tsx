import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileText, ListTree, Rocket } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { coursesApi, getErrorMessage, queryKeys } from "@/api";
import { ErrorFallback } from "@/components/guards";
import { PageHeader } from "@/components/layout";
import { Badge, Card, Skeleton, SkeletonText, Tabs, buttonClassName, type TabItem } from "@/components/ui";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useToast } from "@/hooks/useToast";
import type { CourseCreatePayload } from "@/types";
import { CourseInfoForm } from "./components/CourseInfoForm";
import { CoverUploadCard } from "./components/CoverUploadCard";
import { CurriculumBuilder } from "./components/CurriculumBuilder";
import { PublishTab } from "./components/PublishTab";
import { useEditorCourse } from "./components/useEditorCourse";

type EditorTab = "info" | "curriculum" | "publish";

const TABS: TabItem<EditorTab>[] = [
  { value: "info", label: "Ma'lumot", icon: <FileText className="h-4 w-4" aria-hidden="true" /> },
  { value: "curriculum", label: "Dasturi", icon: <ListTree className="h-4 w-4" aria-hidden="true" /> },
  { value: "publish", label: "Nashr", icon: <Rocket className="h-4 w-4" aria-hidden="true" /> },
];

const isEditorTab = (value: string): value is EditorTab => value === "info" || value === "curriculum" || value === "publish";

const BREADCRUMB_ROOT = { label: "O'qituvchi paneli", to: "/teacher" };

/** Create mode: `/teacher/courses/new`; edit mode: `/teacher/courses/:id/edit?tab=info|curriculum|publish`. */
export default function CourseEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const courseId = id ? Number(id) : null;
  return courseId !== null && Number.isFinite(courseId) && courseId > 0 ? <EditCourse courseId={courseId} /> : <CreateCourse />;
}

function CreateCourse() {
  useDocumentTitle("Yangi kurs");
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (payload: CourseCreatePayload) => coursesApi.create(payload),
    onSuccess: (course) => {
      toast.success("Kurs yaratildi", { description: "Endi dastur qo'shing va nashr qiling." });
      queryClient.setQueryData(queryKeys.course(course.slug), course);
      void queryClient.invalidateQueries({ queryKey: queryKeys.teacher.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      navigate(`/teacher/courses/${course.id}/edit?tab=curriculum`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="animate-in">
      <PageHeader
        title="Yangi kurs"
        description="Avval asosiy ma'lumotlarni saqlang — keyin dastur, video va muqova qo'shasiz."
        breadcrumbs={[BREADCRUMB_ROOT, { label: "Yangi kurs" }]}
      />
      <div className="mx-auto max-w-4xl">
        <CourseInfoForm onSubmit={(payload) => create.mutateAsync(payload)} submitting={create.isPending} submitLabel="Saqlash va davom etish" />
      </div>
    </div>
  );
}

function EditCourse({ courseId }: { courseId: number }) {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { get, set } = useQueryParams();
  const { course, isPending, error, refetch, applyCourse, patchSections } = useEditorCourse(courseId);
  useDocumentTitle(course ? `${course.title} — tahrirlash` : "Kursni tahrirlash");

  const tabParam = get("tab");
  const tab: EditorTab = isEditorTab(tabParam) ? tabParam : "info";
  const setTab = (next: EditorTab) => set("tab", next === "info" ? null : next);

  const update = useMutation({
    mutationFn: (payload: CourseCreatePayload) => coursesApi.update(courseId, payload),
    onSuccess: (updated) => {
      toast.success("O'zgarishlar saqlandi");
      applyCourse(updated);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: () => coursesApi.remove(courseId),
    onSuccess: () => {
      toast.success("Kurs o'chirildi");
      if (course) queryClient.removeQueries({ queryKey: queryKeys.course(course.slug) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.teacher.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      navigate("/teacher", { replace: true });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isPending) return <EditorSkeleton />;
  if (error || !course) return <ErrorFallback message={error ? getErrorMessage(error) : undefined} onRetry={refetch} />;

  const lessonsCount = course.sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const tabsWithCounts = TABS.map((item) => (item.value === "curriculum" ? { ...item, count: lessonsCount } : item));

  return (
    <div className="animate-in">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="min-w-0 break-words">{course.title}</span>
            {course.is_published ? (
              <Badge tone="success" size="md" dot>
                Nashrda
              </Badge>
            ) : (
              <Badge tone="warning" size="md" dot>
                Qoralama
              </Badge>
            )}
          </span>
        }
        description={course.short_description}
        breadcrumbs={[BREADCRUMB_ROOT, { label: course.title }]}
        actions={
          <Link to={`/courses/${course.slug}`} className={buttonClassName({ variant: "outline" })}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Ko'rish
          </Link>
        }
      >
        <Tabs tabs={tabsWithCounts} value={tab} onChange={setTab} label="Kurs muharriri bo'limlari" className="mt-6" />
      </PageHeader>

      {tab === "info" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <CourseInfoForm course={course} onSubmit={(payload) => update.mutateAsync(payload)} submitting={update.isPending} submitLabel="Saqlash" />
          <div className="lg:sticky lg:top-24">
            <CoverUploadCard course={course} onUploaded={applyCourse} />
          </div>
        </div>
      )}

      {tab === "curriculum" && <CurriculumBuilder course={course} patchSections={patchSections} />}

      {tab === "publish" && (
        <PublishTab
          course={course}
          onCourseChange={applyCourse}
          onDelete={() => remove.mutateAsync()}
          deleting={remove.isPending}
          onGoToTab={setTab}
        />
      )}
    </div>
  );
}

/** Mirrors the header + info tab layout while the course loads. */
function EditorSkeleton() {
  return (
    <div className="animate-in" aria-busy="true" aria-label="Yuklanmoqda">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="mb-3 h-3 w-48" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="mt-6 flex gap-1 border-b border-slate-200 dark:border-slate-800">
          <Skeleton className="mb-2 h-6 w-24" count={3} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="space-y-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-40 w-full" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" count={4} />
            </div>
          </Card>
          <Card className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <SkeletonText lines={4} />
          </Card>
        </div>
        <Card className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </Card>
      </div>
    </div>
  );
}
