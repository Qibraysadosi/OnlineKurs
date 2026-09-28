import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ListPlus, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { getErrorMessage, lessonsApi, sectionsApi } from "@/api";
import { Button, Card, ConfirmDialog, EmptyState, Input } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import type { CourseDetail, LessonOut, SectionOut } from "@/types";
import { LessonModal } from "./LessonModal";
import { SectionCard } from "./SectionCard";
import { sectionTitleSchema, type SectionFormValues } from "./schemas";

type SectionsUpdater = (course: CourseDetail) => CourseDetail;

export interface CurriculumBuilderProps {
  course: CourseDetail;
  /** Applies an optimistic cache update, then refetches the course */
  patchSections: (slug: string, updater: SectionsUpdater) => void;
}

type DeleteTarget = { kind: "section"; section: SectionOut } | { kind: "lesson"; lesson: LessonOut; section: SectionOut };

interface LessonModalState {
  sectionId: number;
  lesson: LessonOut | null;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = items.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

const replaceSection = (sections: SectionOut[], updated: SectionOut) =>
  sections.map((section) => (section.id === updated.id ? updated : section));

/** Curriculum tab: section + lesson CRUD, reorder and the lesson modal. */
export function CurriculumBuilder({ course, patchSections }: CurriculumBuilderProps) {
  const toast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [lessonModal, setLessonModal] = useState<LessonModalState | null>(null);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);

  const patch = (updater: SectionsUpdater) => patchSections(course.slug, updater);
  const onError = (err: unknown) => toast.error(getErrorMessage(err));

  const addForm = useForm<SectionFormValues>({ resolver: zodResolver(sectionTitleSchema), defaultValues: { title: "" } });

  const createSection = useMutation({
    mutationFn: (title: string) => sectionsApi.create(course.id, { title }),
    onSuccess: (section) => {
      toast.success("Bo'lim qo'shildi");
      patch((current) => ({ ...current, sections: [...current.sections, section] }));
      addForm.reset({ title: "" });
    },
    onError,
  });

  const renameSection = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => sectionsApi.update(id, { title }),
    onSuccess: (section) => {
      toast.success("Bo'lim nomi o'zgartirildi");
      patch((current) => ({ ...current, sections: replaceSection(current.sections, section) }));
    },
    onError,
  });

  const deleteSection = useMutation({
    mutationFn: (id: number) => sectionsApi.remove(id),
    onSuccess: (_, id) => {
      toast.success("Bo'lim o'chirildi");
      patch((current) => ({ ...current, sections: current.sections.filter((section) => section.id !== id) }));
    },
    onError,
  });

  const reorderSections = useMutation({
    mutationFn: (sectionIds: number[]) => sectionsApi.reorder(course.id, { section_ids: sectionIds }),
    onSuccess: (sections) => patch((current) => ({ ...current, sections })),
    onError,
  });

  const deleteLesson = useMutation({
    mutationFn: (id: number) => lessonsApi.remove(id),
    onSuccess: (_, id) => {
      toast.success("Dars o'chirildi");
      patch((current) => ({
        ...current,
        sections: current.sections.map((section) => ({ ...section, lessons: section.lessons.filter((lesson) => lesson.id !== id) })),
      }));
    },
    onError,
  });

  const reorderLessons = useMutation({
    mutationFn: ({ sectionId, lessonIds }: { sectionId: number; lessonIds: number[] }) =>
      lessonsApi.reorder(sectionId, { lesson_ids: lessonIds }),
    onSuccess: (lessons, { sectionId }) =>
      patch((current) => ({
        ...current,
        sections: current.sections.map((section) => (section.id === sectionId ? { ...section, lessons } : section)),
      })),
    onError,
  });

  const busy =
    createSection.isPending ||
    renameSection.isPending ||
    deleteSection.isPending ||
    reorderSections.isPending ||
    deleteLesson.isPending ||
    reorderLessons.isPending;

  const moveSection = (index: number, direction: -1 | 1) => {
    const next = moveItem(course.sections, index, index + direction);
    if (next !== course.sections) reorderSections.mutate(next.map((section) => section.id));
  };

  const moveLesson = (section: SectionOut, lesson: LessonOut, direction: -1 | 1) => {
    const index = section.lessons.findIndex((item) => item.id === lesson.id);
    const next = moveItem(section.lessons, index, index + direction);
    if (next !== section.lessons) reorderLessons.mutate({ sectionId: section.id, lessonIds: next.map((item) => item.id) });
  };

  const openLessonModal = (sectionId: number, lesson: LessonOut | null) => {
    setLessonModal({ sectionId, lesson });
    setLessonModalOpen(true);
  };

  const upsertLesson = (lesson: LessonOut, sectionId: number) =>
    patch((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const exists = section.lessons.some((item) => item.id === lesson.id);
        return { ...section, lessons: exists ? section.lessons.map((item) => (item.id === lesson.id ? lesson : item)) : [...section.lessons, lesson] };
      }),
    }));

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "section") await deleteSection.mutateAsync(deleteTarget.section.id);
    else await deleteLesson.mutateAsync(deleteTarget.lesson.id);
  };

  const submitAdd = addForm.handleSubmit((values) => createSection.mutate(values.title.trim()));
  const lessonsTotal = course.sections.reduce((sum, section) => sum + section.lessons.length, 0);

  /** The lesson shown in the modal, kept in sync with the cache so uploads reflect immediately. */
  const modalLesson =
    lessonModal?.lesson
      ? (course.sections.find((section) => section.id === lessonModal.sectionId)?.lessons.find((lesson) => lesson.id === lessonModal.lesson?.id) ??
        lessonModal.lesson)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Kurs dasturi</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {course.sections.length} ta bo'lim · {lessonsTotal} ta dars. Tartibni o'q tugmalari bilan o'zgartiring.
        </p>
      </div>

      {course.sections.length === 0 ? (
        <EmptyState
          icon={<ListPlus className="h-7 w-7" aria-hidden="true" />}
          title="Hali bo'limlar yo'q"
          description="Kurs dasturi bo'limlardan, bo'limlar esa darslardan iborat. Birinchi bo'limni quyida yarating."
        />
      ) : (
        <div className="space-y-4">
          {course.sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              total={course.sections.length}
              busy={busy}
              onMove={(direction) => moveSection(index, direction)}
              onRename={(title) => renameSection.mutateAsync({ id: section.id, title })}
              onDelete={() => setDeleteTarget({ kind: "section", section })}
              onAddLesson={() => openLessonModal(section.id, null)}
              onEditLesson={(lesson) => openLessonModal(section.id, lesson)}
              onDeleteLesson={(lesson) => setDeleteTarget({ kind: "lesson", lesson, section })}
              onMoveLesson={(lesson, direction) => moveLesson(section, lesson, direction)}
            />
          ))}
        </div>
      )}

      <Card>
        <form onSubmit={submitAdd} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Input
            label="Yangi bo'lim"
            placeholder="Masalan: Kirish"
            error={addForm.formState.errors.title?.message}
            {...addForm.register("title")}
          />
          <Button
            type="submit"
            variant="primary"
            loading={createSection.isPending}
            leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
            className="sm:mt-7 sm:shrink-0"
          >
            Bo'lim qo'shish
          </Button>
        </form>
      </Card>

      <LessonModal
        open={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        sectionId={lessonModal?.sectionId ?? null}
        lesson={modalLesson}
        onCreated={(lesson, sectionId) => {
          upsertLesson(lesson, sectionId);
          setLessonModal({ sectionId, lesson });
        }}
        onUpdated={upsertLesson}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget?.kind === "section" ? "Bo'limni o'chirasizmi?" : "Darsni o'chirasizmi?"}
        description={
          deleteTarget?.kind === "section"
            ? `"${deleteTarget.section.title}" bo'limi va undagi ${deleteTarget.section.lessons.length} ta dars o'chiriladi.`
            : deleteTarget
              ? `"${deleteTarget.lesson.title}" darsi va unga yuklangan fayllar o'chiriladi.`
              : undefined
        }
        confirmText="O'chirish"
        loading={deleteSection.isPending || deleteLesson.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
