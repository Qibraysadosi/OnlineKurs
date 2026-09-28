import { CreditCard } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Skeleton,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  TableContainer,
  TableEmptyRow,
  TableSkeletonRows,
} from "@/components/ui";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  cn,
  formatDate,
  formatDateTime,
  formatPrice,
  paymentStatusColor,
  paymentStatusLabel,
  providerLabel,
} from "@/lib/utils";
import type { Payment } from "@/types";
import { UserCell } from "./UserCell";

const COLS = 5;
/** Slightly tighter cells so five columns fit the 1280px dashboard content width without scrolling. */
const CELL = "px-3 first:pl-4 last:pr-4";

export interface PaymentsTableProps {
  payments: Payment[] | undefined;
  /** First load: shimmering rows */
  loading: boolean;
  /** Background refetch: previous rows stay, dimmed */
  refreshing?: boolean;
  /** Custom status cell (e.g. a select on the payments page); defaults to a badge */
  statusCell?: (payment: Payment) => ReactNode;
  emptyText?: string;
  className?: string;
}

function StatusCell({
  payment,
  statusCell,
}: {
  payment: Payment;
  statusCell?: (payment: Payment) => ReactNode;
}) {
  return (
    <>
      {statusCell ? (
        statusCell(payment)
      ) : (
        <Badge tone={paymentStatusColor(payment.status)} dot>
          {paymentStatusLabel(payment.status)}
        </Badge>
      )}
      {payment.paid_at && (
        <p
          className="mt-1 text-xs text-slate-500 dark:text-slate-400"
          title={formatDateTime(payment.paid_at)}
        >
          To'langan: {formatDate(payment.paid_at)}
        </p>
      )}
    </>
  );
}

function CourseCell({
  payment,
  className,
}: {
  payment: Payment;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <Link
        to={`/courses/${payment.course.slug}`}
        className="ok-focus block max-w-[220px] truncate rounded font-medium text-slate-900 transition hover:text-primary-600 dark:text-slate-100 dark:hover:text-primary-300"
      >
        {payment.course.title}
      </Link>
      <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500 dark:text-slate-400">
        {payment.course.teacher.full_name}
      </p>
    </div>
  );
}

function EmptyNotice({ text }: { text: string }) {
  return (
    <span className="inline-flex flex-col items-center gap-2">
      <CreditCard className="h-6 w-6 text-slate-400" aria-hidden="true" />
      {text}
    </span>
  );
}

/**
 * Shared payments list for the dashboard "recent payments" card and the payments page:
 * a five-column table from `md` up, stacked cards below it (five columns cannot fit a phone).
 * Only one layout is mounted at a time so controls (e.g. the status select) exist once.
 */
export function PaymentsTable({
  payments,
  loading,
  refreshing,
  statusCell,
  emptyText = "Hali to'lovlar yo'q",
  className,
}: PaymentsTableProps) {
  const empty = !loading && (!payments || payments.length === 0);
  const isWide = useMediaQuery("(min-width: 768px)");
  return (
    <div
      className={cn(
        "transition-opacity duration-200",
        refreshing && "opacity-60",
        className,
      )}
    >
      {!isWide ? (
        <ul
          className="ok-card divide-y divide-slate-200 dark:divide-slate-800"
          aria-busy={loading || undefined}
        >
          {loading ? (
            Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="space-y-3 p-4" aria-hidden="true">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </li>
            ))
          ) : empty ? (
            <li className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              <EmptyNotice text={emptyText} />
            </li>
          ) : (
            payments!.map((payment) => (
              <li key={payment.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <UserCell user={payment.user} />
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatPrice(payment.amount, "0 so'm")}
                  </span>
                </div>
                <CourseCell payment={payment} />
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="tabular-nums">#{payment.id}</span> ·{" "}
                    {providerLabel(payment.provider)} ·{" "}
                    {formatDate(payment.created_at)}
                  </p>
                  <div className="min-w-0">
                    <StatusCell payment={payment} statusCell={statusCell} />
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      ) : (
        <TableContainer>
          <Table className="min-w-[800px]">
            <THead>
              <TR>
                <TH className={CELL}>To'lov</TH>
                <TH className={CELL}>Foydalanuvchi</TH>
                <TH className={CELL}>Kurs</TH>
                <TH align="right" className={CELL}>
                  Summa
                </TH>
                <TH className={CELL}>Holat</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TableSkeletonRows rows={5} cols={COLS} />
              ) : empty ? (
                <TableEmptyRow colSpan={COLS}>
                  <EmptyNotice text={emptyText} />
                </TableEmptyRow>
              ) : (
                payments!.map((payment) => (
                  <TR key={payment.id}>
                    <TD className={cn(CELL, "whitespace-nowrap")}>
                      <p className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
                        #{payment.id}{" "}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          · {providerLabel(payment.provider)}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(payment.created_at)}
                      </p>
                    </TD>
                    <TD className={CELL}>
                      <UserCell user={payment.user} />
                    </TD>
                    <TD className={CELL}>
                      <CourseCell payment={payment} />
                    </TD>
                    <TD
                      align="right"
                      className={cn(
                        CELL,
                        "whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-slate-100",
                      )}
                    >
                      {formatPrice(payment.amount, "0 so'm")}
                    </TD>
                    <TD className={CELL}>
                      <StatusCell payment={payment} statusCell={statusCell} />
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
