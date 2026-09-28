import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover lift + shadow (for clickable cards) */
  hoverable?: boolean;
  /** Removes the default padding so children control it */
  flush?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { hoverable, flush, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "ok-card",
        hoverable && "hover:-translate-y-0.5",
        !flush && "p-5 sm:p-6",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  /** Right-aligned slot (buttons, badges) */
  actions?: ReactNode;
}

export function CardHeader({ title, description, actions, className, children, ...rest }: CardHeaderProps) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)} {...rest}>
      <div className="min-w-0">
        {title && <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">{title}</h3>}
        {description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm text-slate-700 dark:text-slate-300", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800", className)}
      {...rest}
    />
  );
}

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** Small line under the value, e.g. "+12% oxirgi 30 kun" */
  hint?: ReactNode;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const STAT_TONES = {
  primary: "bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
  danger: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300",
  info: "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300",
};

/** Dashboard stat tile: icon, label, big value. */
export function StatCard({ label, value, icon, hint, tone = "primary", className }: StatCardProps) {
  return (
    <Card className={cn("flex items-center gap-4", className)}>
      {icon && (
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", STAT_TONES[tone])} aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
    </Card>
  );
}
