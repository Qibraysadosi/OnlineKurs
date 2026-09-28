import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, CreditCard, PlayCircle, Receipt, Wallet, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage, paymentsApi, queryKeys } from "@/api";
import { CourseCover } from "@/components/course";
import { ErrorFallback } from "@/components/guards";
import { PageHeader } from "@/components/layout";
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Skeleton,
  StatCard,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  TableContainer,
  TableEmptyRow,
  TableSkeletonRows,
  Tabs,
  buttonClassName,
  type TabItem,
} from "@/components/ui";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useToast } from "@/hooks/useToast";
import { PAYMENT_STATUS_LABELS, formatDate, formatNumber, formatPrice, paymentStatusColor, paymentStatusLabel, providerLabel } from "@/lib/utils";
import type { Payment, PaymentStatus } from "@/types";
import { StatTilesSkeleton } from "./components/StatTilesSkeleton";

type Filter = "all" | PaymentStatus;
const TABLE_COLS = 5;
const STATUS_ORDER: PaymentStatus[] = ["paid", "pending", "failed", "refunded"];

/** "2026-01-12T10:05:00Z" -> "10:05" (local time) */
function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Per-status actions: continue learning, finish or cancel a pending checkout, revisit the course. */
function PaymentActions({ payment, onCancel }: { payment: Payment; onCancel: (payment: Payment) => void }) {
  return (
    <div className="flex items-center justify-end gap-2">
      {payment.status === "paid" && (
        <Link to={`/learn/${payment.course.slug}`} className={buttonClassName({ variant: "outline", size: "sm" })}>
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          Darsga o'tish
        </Link>
      )}
      {payment.status === "pending" && (
        <>
          <Link to={`/checkout/${payment.course.slug}`} className={buttonClassName({ variant: "primary", size: "sm" })}>
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            To'lash
          </Link>
          <IconButton
            aria-label={`${payment.course.title} — to'lovni bekor qilish`}
            title="Bekor qilish"
            size="sm"
            onClick={() => onCancel(payment)}
            className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </>
      )}
      {(payment.status === "failed" || payment.status === "refunded") && (
        <Link to={`/courses/${payment.course.slug}`} className={buttonClassName({ variant: "ghost", size: "sm" })}>
          Kursni ko'rish
        </Link>
      )}
    </div>
  );
}

function CourseCell({ payment }: { payment: Payment }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <CourseCover course={payment.course} className="hidden h-11 w-[72px] shrink-0 rounded-lg xl:block" letterClassName="text-lg" />
      <div className="min-w-0">
        <Link
          to={`/courses/${payment.course.slug}`}
          className="ok-focus block max-w-[220px] truncate rounded font-medium text-slate-900 transition hover:text-primary-600 dark:text-slate-100 dark:hover:text-primary-300"
        >
          {payment.course.title}
        </Link>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {payment.course.teacher.full_name} · №{payment.id}
        </p>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  useDocumentTitle("To'lovlarim");
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [cancelTarget, setCancelTarget] = useState<Payment | null>(null);
  // Five columns cannot fit a phone: stacked cards below md, the table from md up.
  const isWide = useMediaQuery("(min-width: 768px)");

  const payments = useQuery({ queryKey: queryKeys.payments, queryFn: paymentsApi.mine });

  const cancel = useMutation({
    mutationFn: (payment: Payment) => paymentsApi.cancel(payment.id),
    onSuccess: () => {
      toast.success("To'lov bekor qilindi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const all = payments.data ?? [];
  const visible = filter === "all" ? all : all.filter((p) => p.status === filter);
  const paid = all.filter((p) => p.status === "paid");
  const totalPaid = paid.reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = all.filter((p) => p.status === "pending").length;

  const tabs: TabItem<Filter>[] = [
    { value: "all", label: "Barchasi", count: all.length },
    ...STATUS_ORDER.map((status) => ({
      value: status,
      label: PAYMENT_STATUS_LABELS[status],
      count: all.filter((p) => p.status === status).length,
    })),
  ];

  return (
    <div className="animate-in">
      <PageHeader title="To'lovlarim" description="Kurslar uchun qilgan barcha to'lovlaringiz tarixi." />

      <section aria-label="To'lovlar statistikasi" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {payments.isPending ? (
          <StatTilesSkeleton count={3} />
        ) : payments.isError ? null : (
          <>
            <StatCard
              label="Jami to'langan"
              value={formatPrice(totalPaid, "0 so'm")}
              hint={`${paid.length} ta muvaffaqiyatli to'lov`}
              icon={<Wallet className="h-6 w-6" />}
              tone="success"
            />
            <StatCard label="Sotib olingan kurslar" value={formatNumber(paid.length)} icon={<CreditCard className="h-6 w-6" />} tone="primary" />
            <StatCard
              label="Kutilayotgan"
              value={formatNumber(pendingCount)}
              hint={pendingCount > 0 ? "Yakunlanmagan to'lovlar" : "Barchasi yakunlangan"}
              icon={<Clock className="h-6 w-6" />}
              tone={pendingCount > 0 ? "warning" : "info"}
            />
          </>
        )}
      </section>

      <section aria-labelledby="payments-heading" className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="payments-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            To'lovlar tarixi
          </h2>
          {all.length > 0 && (
            <Tabs tabs={tabs} value={filter} onChange={setFilter} variant="pills" label="Holat bo'yicha filtrlash" className="max-w-full flex-wrap" />
          )}
        </div>

        {payments.isError ? (
          <ErrorFallback message={getErrorMessage(payments.error)} onRetry={() => payments.refetch()} />
        ) : !payments.isPending && all.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-7 w-7" aria-hidden="true" />}
            title="Hali to'lovlar yo'q"
            description="Pullik kurs sotib olganingizda to'lov shu yerda ko'rinadi."
            action={
              <Link to="/courses?price=paid" className={buttonClassName()}>
                Kurslarni ko'rish
              </Link>
            }
          />
        ) : !isWide ? (
          <ul className="ok-card divide-y divide-slate-200 dark:divide-slate-800" aria-busy={payments.isPending || undefined}>
            {payments.isPending ? (
              Array.from({ length: 3 }, (_, i) => (
                <li key={i} className="space-y-3 p-4" aria-hidden="true">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </li>
              ))
            ) : visible.length === 0 ? (
              <li className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">Bu holatda to'lovlar yo'q</li>
            ) : (
              visible.map((payment) => (
                <li key={payment.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <CourseCell payment={payment} />
                    <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatPrice(payment.amount)}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone={paymentStatusColor(payment.status)} dot>
                      {paymentStatusLabel(payment.status)}
                    </Badge>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(payment.paid_at ?? payment.created_at)} ·{" "}
                      {payment.status === "paid" ? providerLabel(payment.provider) : formatTime(payment.created_at)}
                    </p>
                  </div>
                  <PaymentActions payment={payment} onCancel={setCancelTarget} />
                </li>
              ))
            )}
          </ul>
        ) : (
          <TableContainer>
            <Table className="min-w-[720px]">
              <THead>
                <TR>
                  <TH>Kurs</TH>
                  <TH align="right">Summa</TH>
                  <TH>Holat</TH>
                  <TH>Sana</TH>
                  <TH align="right">Amallar</TH>
                </TR>
              </THead>
              <TBody>
                {payments.isPending ? (
                  <TableSkeletonRows rows={4} cols={TABLE_COLS} />
                ) : visible.length === 0 ? (
                  <TableEmptyRow colSpan={TABLE_COLS}>Bu holatda to'lovlar yo'q</TableEmptyRow>
                ) : (
                  visible.map((payment) => (
                    <TR key={payment.id}>
                      <TD>
                        <CourseCell payment={payment} />
                      </TD>
                      <TD align="right" className="whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {formatPrice(payment.amount)}
                      </TD>
                      <TD>
                        <Badge tone={paymentStatusColor(payment.status)} dot>
                          {paymentStatusLabel(payment.status)}
                        </Badge>
                      </TD>
                      <TD className="whitespace-nowrap text-slate-600 dark:text-slate-400">
                        <span className="block">{formatDate(payment.paid_at ?? payment.created_at)}</span>
                        <span className="block text-xs text-slate-400 dark:text-slate-500">
                          {payment.status === "paid" ? providerLabel(payment.provider) : formatTime(payment.created_at)}
                        </span>
                      </TD>
                      <TD align="right">
                        <PaymentActions payment={payment} onCancel={setCancelTarget} />
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </TableContainer>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="To'lovni bekor qilasizmi?"
        description={`"${cancelTarget?.course.title}" uchun kutilayotgan to'lov bekor qilinadi. Keyinroq qayta to'lashingiz mumkin.`}
        confirmText="Bekor qilish"
        cancelText="Ortga"
        loading={cancel.isPending}
        onConfirm={async () => {
          await cancel.mutateAsync(cancelTarget!);
        }}
      />
    </div>
  );
}
