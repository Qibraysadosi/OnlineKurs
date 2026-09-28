import { ChevronRight } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  to?: string;
}

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned actions (buttons) */
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
  className?: string;
  /** Rendered under the title row, e.g. a Tabs strip */
  children?: ReactNode;
}

export function PageHeader({ title, description, actions, breadcrumbs, className, children }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 sm:mb-8", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Yo'l" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          {breadcrumbs.map((crumb, idx) => (
            <span key={`${crumb.label}-${idx}`} className="flex items-center gap-1">
              {idx > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
              {crumb.to ? (
                <Link to={crumb.to} className="ok-focus rounded transition hover:text-primary-600 dark:hover:text-primary-300">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-slate-700 dark:text-slate-300">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400 sm:text-base">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
