import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { categoriesApi, queryKeys } from "@/api";
import { Button, Card, CardHeader, Input, Select, Textarea } from "@/components/ui";
import { LEVEL_LABELS } from "@/lib/utils";
import type { CourseCreatePayload, CourseDetail } from "@/types";
import { ListFieldEditor } from "./ListFieldEditor";
import { courseFormSchema, courseFormToPayload, courseToFormValues, EMPTY_COURSE_FORM, LANGUAGE_OPTIONS, type CourseFormValues } from "./schemas";

interface CourseInfoFormProps {
  /** Existing course in edit mode; undefined in create mode */
  course?: CourseDetail;
  onSubmit: (payload: CourseCreatePayload) => Promise<unknown>;
  submitting: boolean;
  submitLabel: string;
}

const LEVEL_OPTIONS = Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }));

/** Course metadata form used by both editor modes. */
export function CourseInfoForm({ course, onSubmit, submitting, submitLabel }: CourseInfoFormProps) {
  const categories = useQuery({ queryKey: queryKeys.categories, queryFn: categoriesApi.list });
  const defaultValues = useMemo(() => (course ? courseToFormValues(course) : EMPTY_COURSE_FORM), [course]);

  const form = useForm<CourseFormValues>({ resolver: zodResolver(courseFormSchema), defaultValues });
  const { register, control, handleSubmit, reset, formState } = form;
  const { errors, isDirty } = formState;

  // Re-apply defaults once the category options exist, otherwise the native <select>
  // cannot show the stored category on the first render.
  const categoriesReady = categories.isSuccess;
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, categoriesReady, reset]);

  const categoryOptions = useMemo(
    () => (categories.data ?? []).map((category) => ({ value: String(category.id), label: category.name })),
    [categories.data],
  );

  const submit = handleSubmit(async (values) => {
    await onSubmit(courseFormToPayload(values));
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card>
        <CardHeader title="Asosiy ma'lumotlar" description="Kurs nomi, tavsifi va narxi talabalar uchun katalogda ko'rinadi." />
        <div className="space-y-5">
          <Input
            label="Kurs nomi"
            required
            placeholder="Masalan: Python asoslari: noldan dasturchigacha"
            error={errors.title?.message}
            {...register("title")}
          />
          <Textarea
            label="Qisqa tavsif"
            required
            rows={2}
            placeholder="Kurs kartochkasida ko'rinadigan 1–2 jumla"
            hint="Maksimal 300 belgi"
            error={errors.short_description?.message}
            {...register("short_description")}
          />
          <Textarea
            label="To'liq tavsif"
            required
            rows={8}
            placeholder="Kurs nimalar haqida, kimlar uchun mo'ljallangan va qanday natijaga olib keladi"
            error={errors.description?.message}
            {...register("description")}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Kategoriya"
              placeholder={categories.isPending ? "Yuklanmoqda…" : "Kategoriyasiz"}
              options={categoryOptions}
              disabled={categories.isPending}
              error={errors.category_id?.message}
              {...register("category_id")}
            />
            <Select label="Daraja" required options={LEVEL_OPTIONS} error={errors.level?.message} {...register("level")} />
            <Input
              label="Narx (so'm)"
              required
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              hint="0 — bepul kurs"
              error={errors.price?.message}
              {...register("price")}
            />
            <Select label="Til" required options={LANGUAGE_OPTIONS} error={errors.language?.message} {...register("language")} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Kurs mazmuni" description="Talabalar nimalarni o'rganadi va boshlash uchun nimalar kerak." />
        <div className="grid gap-6 lg:grid-cols-2">
          <ListFieldEditor
            name="what_you_learn"
            label="Nimalarni o'rganasiz"
            placeholder="Masalan: Python sintaksisi va ma'lumot turlari"
            hint="Ko'pi bilan 20 ta band"
            control={control}
            register={register}
            errors={errors}
          />
          <ListFieldEditor
            name="requirements"
            label="Talablar"
            placeholder="Masalan: Kompyuter va internet"
            hint="Ko'pi bilan 20 ta band"
            control={control}
            register={register}
            errors={errors}
          />
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {course && isDirty && !submitting && (
          <span className="text-xs text-amber-600 dark:text-amber-400">Saqlanmagan o'zgarishlar bor</span>
        )}
        <Button type="submit" variant="gradient" size="lg" loading={submitting} leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
