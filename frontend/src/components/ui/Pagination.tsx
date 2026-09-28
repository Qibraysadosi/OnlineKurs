import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  /** Total item count, shown as "Jami: 120" when provided */
  total?: number;
  className?: string;
}

function range(page: number, pages: number): Array<number | "…"> {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const items: Array<number | "…"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) items.push("…");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < pages - 1) items.push("…");
  items.push(pages);
  return items;
}

const BASE =
  "ok-focus inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40";

export function Pagination({ page, pages, onChange, total, className }: PaginationProps) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Sahifalar" className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      {total !== undefined ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Jami: <span className="font-medium text-slate-700 dark:text-slate-200">{total}</span>
        </p>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Oldingi sahifa"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className={cn(BASE, "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        {range(page, pages).map((item, idx) =>
          item === "…" ? (
            <span key={`gap-${idx}`} className="px-1 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === page ? "page" : undefined}
              onClick={() => onChange(item)}
              className={cn(
                BASE,
                item === page
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Keyingi sahifa"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className={cn(BASE, "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
