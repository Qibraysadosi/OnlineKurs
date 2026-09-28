import { CreditCard } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge, TBody, TD, TH, THead, TR, Table, TableContainer, TableEmptyRow, TableSkeletonRows } from "@/components/ui";
import { cn, formatDate, formatDateTime, formatPrice, paymentStatusColor, paymentStatusLabel } from "@/lib/utils";
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

/** Shared payments table for the dashboard "recent payments" card and the payments page. */
export function PaymentsTable({ payments, loading, refreshing, statusCell, emptyText = "Hali to'lovlar yo'q", className }: PaymentsTableProps) {
  return (
    <TableContainer className={cn("transition-opacity duration-200", refreshing && "opacity-60", className)}>
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
          ) : !payments || payments.length === 0 ? (
            <TableEmptyRow colSpan={COLS}>
              <span className="inline-flex flex-col items-center gap-2">
                <CreditCard className="h-6 w-6 text-slate-400" aria-hidden="true" />
                {emptyText}
              </span>
            </TableEmptyRow>
          ) : (
            payments.map((payment) => (
              <TR key={payment.id}>
                <TD className={cn(CELL, "whitespace-nowrap")}>
                  <p className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
                    #{payment.id} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">· {payment.provider}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(payment.created_at)}</p>
                </TD>
                <TD className={CELL}>
                  <UserCell user={payment.user} />
                </TD>
                <TD className={CELL}>
                  <Link
                    to={`/courses/${payment.course.slug}`}
                    className="ok-focus block max-w-[220px] truncate rounded font-medium text-slate-900 transition hover:text-primary-600 dark:text-slate-100 dark:hover:text-primary-300"
                  >
                    {payment.course.title}
                  </Link>
                  <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500 dark:text-slate-400">{payment.course.teacher.full_name}</p>
                </TD>
                <TD align="right" className={cn(CELL, "whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-slate-100")}>
                  {formatPrice(payment.amount, "0 so'm")}
                </TD>
                <TD className={CELL}>
                  {statusCell ? (
                    statusCell(payment)
                  ) : (
                    <Badge tone={paymentStatusColor(payment.status)} dot>
                      {paymentStatusLabel(payment.status)}
                    </Badge>
                  )}
                  {payment.paid_at && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400" title={formatDateTime(payment.paid_at)}>
                      To'langan: {formatDate(payment.paid_at)}
                    </p>
                  )}
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </TableContainer>
  );
}
