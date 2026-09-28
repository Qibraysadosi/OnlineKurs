import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  id: string;
  title: string;
  description?: ReactNode;
  /** Right-aligned link or button */
  action?: ReactNode;
  className?: string;
}

/** Section title row used between dashboard blocks. */
export function SectionHeading({ id, title, description, action, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
