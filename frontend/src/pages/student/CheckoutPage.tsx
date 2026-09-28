import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { BookOpen, PlayCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { coursesApi, getErrorMessage, paymentsApi, queryKeys } from "@/api";
import { ErrorFallback } from "@/components/guards";
import { PageHeader } from "@/components/layout";
import { Alert, EmptyState, Skeleton, buttonClassName } from "@/components/ui";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useToast } from "@/hooks/useToast";
import { sleep } from "@/lib/utils";
import type { Payment } from "@/types";
import { CheckoutForm } from "./components/CheckoutForm";
import { CheckoutSuccess } from "./components/CheckoutSuccess";
import { OrderSummary } from "./components/OrderSummary";

/** Small pause so the mock gateway feels like it is doing something. */
const MOCK_PROCESSING_MS = 900;

function CheckoutSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]" aria-hidden="true">
      <div className="ok-card space-y-5 p-5 sm:p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <div className="ok-card overflow-hidden">
        <Skeleton className="aspect-video w-full rounded-none" />
        <div className="space-y-3 p-5">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [paid, setPaid] = useState<Payment | null>(null);

  const courseQuery = useQuery({ queryKey: queryKeys.course(slug), queryFn: () => coursesApi.get(slug), enabled: Boolean(slug) });
  const course = courseQuery.data;
  useDocumentTitle(course ? `To'lov: ${course.title}` : "To'lov");

  const needsPayment = Boolean(course && course.price > 0 && !course.has_access && !course.is_enrolled);
  const paymentsQuery = useQuery({ queryKey: queryKeys.payments, queryFn: paymentsApi.mine, enabled: needsPayment });
  const pendingPayment = paymentsQuery.data?.find((p) => p.course.id === course?.id && p.status === "pending") ?? null;

  const pay = useMutation({
    mutationFn: async (courseId: number) => {
      const payment = pendingPayment ?? (await paymentsApi.create({ course_id: courseId }));
      await sleep(MOCK_PROCESSING_MS);
      return paymentsApi.confirm(payment.id);
    },
    onSuccess: async (payment) => {
      toast.success("To'lov qabul qilindi", { description: "Kurs darslari siz uchun ochildi." });
      void queryClient.invalidateQueries({ queryKey: queryKeys.enrollments });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      // The "Darsni boshlash" link relies on the cached course carrying has_access=true.
      await queryClient.invalidateQueries({ queryKey: queryKeys.course(slug) });
      setPaid(payment);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      if (isAxiosError(err) && err.response?.status === 409) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.course(slug) });
      }
    },
  });

  const breadcrumbs = [
    { label: "Kurslar", to: "/courses" },
    ...(course ? [{ label: course.title, to: `/courses/${course.slug}` }] : []),
    { label: "To'lov" },
  ];

  if (courseQuery.isPending) {
    return (
      <div className="animate-in">
        <PageHeader title="To'lov" description="Buyurtmangiz tayyorlanmoqda..." />
        <CheckoutSkeleton />
      </div>
    );
  }

  if (courseQuery.isError) {
    if (isAxiosError(courseQuery.error) && courseQuery.error.response?.status === 404) {
      return (
        <EmptyState
          icon={<BookOpen className="h-7 w-7" aria-hidden="true" />}
          title="Kurs topilmadi"
          description="Bu kurs mavjud emas yoki hali nashr qilinmagan."
          action={
            <Link to="/courses" className={buttonClassName()}>
              Barcha kurslar
            </Link>
          }
        />
      );
    }
    return <ErrorFallback message={getErrorMessage(courseQuery.error)} onRetry={() => courseQuery.refetch()} />;
  }

  if (!course) return null;

  if (paid) {
    return (
      <div className="animate-in">
        <PageHeader title="To'lov yakunlandi" breadcrumbs={breadcrumbs} />
        <CheckoutSuccess payment={paid} />
      </div>
    );
  }

  if (course.has_access || course.is_enrolled) {
    return (
      <div className="animate-in">
        <PageHeader title="To'lov" breadcrumbs={breadcrumbs} />
        <EmptyState
          icon={<PlayCircle className="h-7 w-7" aria-hidden="true" />}
          title="Bu kurs sizda allaqachon bor"
          description="To'lov talab qilinmaydi — darslarni hoziroq davom ettirishingiz mumkin."
          action={
            <Link to={`/learn/${course.slug}`} className={buttonClassName({ variant: "gradient" })}>
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              Darslarga o'tish
            </Link>
          }
        />
      </div>
    );
  }

  if (course.price <= 0) {
    return (
      <div className="animate-in">
        <PageHeader title="To'lov" breadcrumbs={breadcrumbs} />
        <EmptyState
          icon={<Sparkles className="h-7 w-7" aria-hidden="true" />}
          title="Bu kurs bepul"
          description="To'lov kerak emas — kurs sahifasidan bir zumda yozilishingiz mumkin."
          action={
            <Link to={`/courses/${course.slug}`} className={buttonClassName({ variant: "gradient" })}>
              Kursga yozilish
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-in">
      <PageHeader title="To'lov" description="Buyurtmani tasdiqlang va darslarni darhol boshlang." breadcrumbs={breadcrumbs} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0 space-y-4">
          {pendingPayment && (
            <Alert tone="info" title="Kutilayotgan to'lov topildi">
              №{pendingPayment.id} raqamli to'lovingiz yakunlanmagan edi — uni hozir tasdiqlaysiz.
            </Alert>
          )}
          <CheckoutForm amount={course.price} submitting={pay.isPending} onSubmit={() => pay.mutate(course.id)} />
        </div>
        <OrderSummary course={course} />
      </div>
    </div>
  );
}
