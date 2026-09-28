import { type HTMLAttributes, type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Table primitives. Wrap in <TableContainer> for the card frame + horizontal scroll on mobile.
 *
 * <TableContainer>
 *   <Table>
 *     <THead><TR><TH>Nomi</TH><TH align="right">Narx</TH></TR></THead>
 *     <TBody>{rows.map(r => <TR key={r.id}><TD>{r.name}</TD><TD align="right">{r.price}</TD></TR>)}</TBody>
 *   </Table>
 * </TableContainer>
 */
export function TableContainer({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60",
        className,
      )}
      {...rest}
    />
  );
}

export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full min-w-[640px] border-collapse text-left text-sm", className)} {...rest} />;
}

export function THead({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400", className)}
      {...rest}
    />
  );
}

export function TBody({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-slate-200 dark:divide-slate-800", className)} {...rest} />;
}

export interface TRProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Adds a hover background (for clickable rows) */
  hoverable?: boolean;
}

export function TR({ className, hoverable, ...rest }: TRProps) {
  return (
    <tr
      className={cn("transition-colors", hoverable && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60", className)}
      {...rest}
    />
  );
}

export interface CellProps {
  align?: "left" | "center" | "right";
}

export function TH({ className, align = "left", ...rest }: ThHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return (
    <th
      scope="col"
      className={cn("px-4 py-3 font-semibold", align === "right" && "text-right", align === "center" && "text-center", className)}
      {...rest}
    />
  );
}

export function TD({ className, align = "left", ...rest }: TdHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-slate-700 dark:text-slate-300",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
      {...rest}
    />
  );
}

/** Full-width row for empty / loading states inside a table body. */
export function TableEmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        {children}
      </td>
    </tr>
  );
}

/** Shimmering rows while data loads. */
export function TableSkeletonRows({ rows = 5, cols }: { rows?: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }, (_, c) => (
            <td key={c} className="px-4 py-3">
              <div className={cn("ok-skeleton h-4", c === 0 ? "w-40" : "w-20")} aria-hidden="true" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
