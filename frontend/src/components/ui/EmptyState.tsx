import { Inbox } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Usually a <Button> or <Link className={buttonClassName()}> */
  action?: ReactNode;
  className?: string;
  /** Compact variant for inside cards */
  size?: "sm" | "md";
}

export function EmptyState({ icon, title, description, action, className, size = "md" }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 text-center dark:border-slate-700",
        size === "md" ? "px-6 py-16" : "px-4 py-10",
        className,
      )}
    >
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-500 dark:bg-primary-950/60 dark:text-primary-300"
        aria-hidden="true"
      >
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
