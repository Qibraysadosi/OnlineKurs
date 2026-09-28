import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AlertTone = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
  className?: string;
  /** Right-aligned action (e.g. a Button) */
  action?: ReactNode;
}

const STYLES: Record<AlertTone, { box: string; icon: typeof Info; iconColor: string }> = {
  info: { box: "border-primary-200 bg-primary-50 text-primary-900 dark:border-primary-900 dark:bg-primary-950/50 dark:text-primary-100", icon: Info, iconColor: "text-primary-500" },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100", icon: CheckCircle2, iconColor: "text-emerald-500" },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100", icon: AlertTriangle, iconColor: "text-amber-500" },
  danger: { box: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-100", icon: AlertCircle, iconColor: "text-rose-500" },
};

export function Alert({ tone = "info", title, children, icon, onClose, className, action }: AlertProps) {
  const { box, icon: Icon, iconColor } = STYLES[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-xl border p-4 text-sm", box, className)}>
      <span className={cn("mt-0.5 shrink-0", iconColor)} aria-hidden="true">
        {icon ?? <Icon className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>}
      </div>
      {action}
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Yopish" className="ok-focus -m-1 rounded-md p-1 opacity-70 transition hover:opacity-100">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
