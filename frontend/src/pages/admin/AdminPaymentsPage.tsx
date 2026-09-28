import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { useState } from "react";
import { adminApi, getErrorMessage, queryKeys } from "@/api";
import { ErrorFallback } from "@/components/guards";
import { PageHeader } from "@/components/layout";
import { Button, ConfirmDialog, EmptyState, Pagination, Select } from "@/components/ui";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useToast } from "@/hooks/useToast";
import { PAYMENT_STATUS_LABELS, formatNumber, formatPrice, paymentStatusLabel } from "@/lib/utils";
import type { AdminPaymentsParams, Payment, PaymentStatus } from "@/types";
import { PaymentsTable } from "./components/PaymentsTable";
import { useInvalidateAdmin } from "./components/useInvalidateAdmin";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const STATUSES = new Set<string>(Object.keys(PAYMENT_STATUS_LABELS));

function parseStatus(value: string): PaymentStatus | undefined {
  return STATUSES.has(value) ? (value as PaymentStatus) : undefined;
}

interface StatusChange {
  payment: Payment;
  status: PaymentStatus;
}

export default function AdminPaymentsPage() {
  useDocumentTitle("To'lovlar");
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const { get, getNumber, setMany, clear } = useQueryParams();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [refundTarget, setRefundTarget] = useState<StatusChange | null>(null);

  const status = parseStatus(get("status"));
  const params: AdminPaymentsParams = { status, page: getNumber("page", 1), page_size: PAGE_SIZE };

  const payments = useQuery({
    queryKey: queryKeys.admin.payments(params),
    queryFn: () => adminApi.payments(params),
    placeholderData: keepPreviousData,
  });

  const update = useMutation({
    mutationFn: ({ payment, status: next }: StatusChange) => adminApi.updatePayment(payment.id, { status: next }),
    onMutate: ({ payment }) => setBusyId(payment.id),
    onSuccess: (updated) => {
      toast.success(`To'lov #${updated.id} holati: ${paymentStatusLabel(updated.status)}`, {
        description:
          updated.status === "paid"
            ? "Talaba kursga yozildi"
            : updated.status === "refunded"
              ? "Talabaning kursga yozilishi bekor qilindi"
              : undefined,
      });
      invalidate(queryKeys.enrollments, queryKeys.payments);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
    onSettled: () => setBusyId(null),
  });

  const requestChange = (payment: Payment, next: PaymentStatus) => {
    if (next === payment.status) return;
    if (next === "refunded") setRefundTarget({ payment, status: next });
    else update.mutate({ payment, status: next });
  };

  const data = payments.data;
  const showEmpty = data !== undefined && data.items.length === 0;

  return (
    <div className="animate-in">
      <PageHeader
        title="To'lovlar"
        description="Barcha to'lovlar ro'yxati. Holatni o'zgartirish talabaning kursga kirishiga ta'sir qiladi."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "To'lovlar" }]}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {data ? `${formatNumber(data.total)} ta to'lov${status ? ` · ${paymentStatusLabel(status)}` : ""}` : " "}
        </p>
        <Select
          aria-label="Holat bo'yicha filtr"
          placeholder="Barcha holatlar"
          options={STATUS_OPTIONS}
          value={status ?? ""}
          onChange={(event) => setMany({ status: event.target.value, page: null })}
          containerClassName="w-full sm:w-52"
        />
      </div>

      {payments.isError ? (
        <ErrorFallback message={getErrorMessage(payments.error)} onRetry={() => payments.refetch()} />
      ) : showEmpty ? (
        <EmptyState
          icon={<CreditCard className="h-7 w-7" aria-hidden="true" />}
          title={status ? "Bunday to'lovlar yo'q" : "Hali to'lovlar yo'q"}
          description={status ? `"${paymentStatusLabel(status)}" holatidagi to'lovlar topilmadi.` : "Talabalar kurs sotib olganda to'lovlar shu yerda ko'rinadi."}
          action={
            status ? (
              <Button variant="outline" onClick={() => clear()}>
                Filtrni tozalash
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <PaymentsTable
            payments={data?.items}
            loading={payments.isPending}
            refreshing={payments.isPlaceholderData}
            statusCell={(payment) => (
              <Select
                size="sm"
                aria-label={`To'lov #${payment.id} — holat`}
                options={STATUS_OPTIONS}
                value={payment.status}
                disabled={busyId === payment.id}
                onChange={(event) => requestChange(payment, event.target.value as PaymentStatus)}
                containerClassName="w-40"
              />
            )}
          />
          {data && (
            <Pagination className="mt-5" page={data.page} pages={data.pages} total={data.total} onChange={(page) => setMany({ page })} />
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        title="To'lovni qaytarasizmi?"
        description={
          refundTarget
            ? `${refundTarget.payment.user.full_name} uchun ${formatPrice(refundTarget.payment.amount)} qaytariladi va "${refundTarget.payment.course.title}" kursiga kirish yopiladi.`
            : undefined
        }
        confirmText="Qaytarish"
        loading={update.isPending}
        onConfirm={async () => {
          await update.mutateAsync(refundTarget!);
        }}
      />
    </div>
  );
}
