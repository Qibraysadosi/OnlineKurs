import { useMutation, useQuery } from "@tanstack/react-query";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { categoriesApi, getErrorMessage, queryKeys } from "@/api";
import { CategoryIcon } from "@/components/course";
import { ErrorFallback } from "@/components/guards";
import { PageHeader } from "@/components/layout";
import { Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, Skeleton } from "@/components/ui";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useToast } from "@/hooks/useToast";
import { categoryGradient, cn } from "@/lib/utils";
import type { Category } from "@/types";
import { CategoryModal } from "./components/CategoryModal";
import { useInvalidateAdmin } from "./components/useInvalidateAdmin";

type Editor = { open: false } | { open: true; category: Category | null };

function coursesLabel(count: number): string {
  return `${count} ta kurs`;
}

function CategoryCardSkeleton() {
  return (
    <div className="ok-card p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  useDocumentTitle("Kategoriyalar");
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [editor, setEditor] = useState<Editor>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const categories = useQuery({ queryKey: queryKeys.categories, queryFn: categoriesApi.list });

  const remove = useMutation({
    mutationFn: (category: Category) => categoriesApi.remove(category.id),
    onSuccess: () => {
      toast.success("Kategoriya o'chirildi");
      invalidate(queryKeys.categories, queryKeys.courses.all);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => setEditor({ open: true, category: null });
  const closeEditor = () => setEditor({ open: false });

  const newButton = (
    <Button variant="gradient" leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={openCreate}>
      Yangi kategoriya
    </Button>
  );

  const list = categories.data;

  return (
    <div className="animate-in">
      <PageHeader
        title="Kategoriyalar"
        description="Kurslar katalogini guruhlash uchun kategoriyalar. Nomi o'zgarsa, havola (slug) ham yangilanadi."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Kategoriyalar" }]}
        actions={newButton}
      />

      {categories.isError ? (
        <ErrorFallback message={getErrorMessage(categories.error)} onRetry={() => categories.refetch()} />
      ) : list && list.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="h-7 w-7" aria-hidden="true" />}
          title="Hali kategoriyalar yo'q"
          description="Birinchi kategoriyani yarating — o'qituvchilar kurs yaratishda uni tanlay oladi."
          action={newButton}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.isPending
            ? Array.from({ length: 6 }, (_, i) => <CategoryCardSkeleton key={i} />)
            : list?.map((category) => (
                <Card key={category.id} className="flex flex-col">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                        categoryGradient(category.slug),
                      )}
                      aria-hidden="true"
                    >
                      <CategoryIcon name={category.icon} className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{category.name}</h3>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">/courses?category={category.slug}</p>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-2 min-h-[2.5rem] text-sm text-slate-600 dark:text-slate-400">
                    {category.description || "Tavsif kiritilmagan"}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <Link
                      to={`/courses?category=${category.slug}`}
                      className="ok-focus rounded-full"
                      aria-label={`${category.name} — kurslarini ko'rish`}
                    >
                      <Badge tone={category.courses_count > 0 ? "primary" : "neutral"}>{coursesLabel(category.courses_count)}</Badge>
                    </Link>
                    <div className="flex items-center gap-0.5">
                      <IconButton
                        aria-label={`${category.name} — tahrirlash`}
                        size="sm"
                        onClick={() => setEditor({ open: true, category })}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                      <IconButton
                        aria-label={`${category.name} — o'chirish`}
                        size="sm"
                        onClick={() => setDeleteTarget(category)}
                        className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                    </div>
                  </div>
                </Card>
              ))}
        </div>
      )}

      <CategoryModal open={editor.open} onClose={closeEditor} category={editor.open ? editor.category : null} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Kategoriyani o'chirasizmi?"
        description={
          deleteTarget
            ? deleteTarget.courses_count > 0
              ? `"${deleteTarget.name}" o'chiriladi. Unga tegishli ${coursesLabel(deleteTarget.courses_count)} kategoriyasiz qoladi.`
              : `"${deleteTarget.name}" butunlay o'chiriladi.`
            : undefined
        }
        confirmText="O'chirish"
        loading={remove.isPending}
        onConfirm={() => remove.mutateAsync(deleteTarget!)}
      />
    </div>
  );
}
