import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { categoriesApi, getErrorMessage, queryKeys } from "@/api";
import { CATEGORY_ICON_OPTIONS, CategoryIcon } from "@/components/course";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { categoryGradient, cn } from "@/lib/utils";
import type { Category, CategoryCreatePayload } from "@/types";
import { useInvalidateAdmin } from "./useInvalidateAdmin";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak")
    .max(100, "Nom 100 belgidan oshmasligi kerak"),
  icon: z.string().max(50, "Belgi nomi juda uzun"),
  description: z.string().trim().max(300, "Tavsif 300 belgidan oshmasligi kerak"),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = { name: "", icon: "", description: "" };

function toFormValues(category: Category | null): FormValues {
  if (!category) return EMPTY;
  return { name: category.name, icon: category.icon ?? "", description: category.description ?? "" };
}

function toPayload(values: FormValues): CategoryCreatePayload {
  return {
    name: values.name.trim(),
    icon: values.icon || null,
    description: values.description.trim() || null,
  };
}

export interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  /** Category being edited; null creates a new one */
  category: Category | null;
}

/**
 * Create / edit category form in a modal, with a live icon preview.
 * The form is mounted per open (keyed by category) so it starts with the right values;
 * resetting an already-interactive form in an effect used to drop the first keystrokes.
 */
export function CategoryModal({ open, onClose, category }: CategoryModalProps) {
  if (!open) return null;
  return <CategoryForm key={category?.id ?? "new"} onClose={onClose} category={category} />;
}

function CategoryForm({ onClose, category }: Omit<CategoryModalProps, "open">) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(category) });
  const { register, handleSubmit, watch, formState } = form;

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      category ? categoriesApi.update(category.id, toPayload(values)) : categoriesApi.create(toPayload(values)),
    onSuccess: () => {
      toast.success(category ? "Kategoriya yangilandi" : "Kategoriya yaratildi");
      invalidate(queryKeys.categories, queryKeys.courses.all);
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const name = watch("name");
  const icon = watch("icon");
  const submitting = formState.isSubmitting || save.isPending;
  const formId = "category-form";

  return (
    <Modal
      open
      onClose={onClose}
      closeOnOverlay={!submitting}
      title={category ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}
      description={category ? `"${category.name}" ma'lumotlarini o'zgartiring.` : "Kurslarni guruhlash uchun yangi kategoriya qo'shing."}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Bekor qilish
          </Button>
          <Button type="submit" form={formId} loading={submitting}>
            {category ? "Saqlash" : "Yaratish"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit((values) => save.mutate(values))} noValidate className="space-y-4">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <div
            className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", categoryGradient(name || "kategoriya"))}
            aria-hidden="true"
          >
            <CategoryIcon name={icon} className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{name.trim() || "Kategoriya nomi"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Katalogda shunday ko'rinadi</p>
          </div>
        </div>
        <Input
          label="Nomi"
          required
          placeholder="Masalan: Dasturlash"
          autoComplete="off"
          error={formState.errors.name?.message}
          {...register("name")}
        />
        <Select
          label="Belgi"
          placeholder="Belgisiz"
          options={CATEGORY_ICON_OPTIONS}
          hint="Kategoriya kartochkasida ko'rsatiladigan belgi"
          error={formState.errors.icon?.message}
          {...register("icon")}
        />
        <Textarea
          label="Tavsif"
          rows={3}
          placeholder="Qisqacha: bu kategoriyada qanday kurslar bor?"
          error={formState.errors.description?.message}
          {...register("description")}
        />
      </form>
    </Modal>
  );
}
