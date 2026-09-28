import { type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string = string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  /** Small counter badge */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** "underline" (default, page sections) or "pills" (segmented control) */
  variant?: "underline" | "pills";
  className?: string;
  /** Accessible label for the tablist */
  label?: string;
}

/** Controlled tab strip. Render the panel yourself based on `value`. */
export function Tabs<T extends string = string>({ tabs, value, onChange, variant = "underline", className, label }: TabsProps<T>) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const enabled = tabs.filter((t) => !t.disabled);
    const idx = enabled.findIndex((t) => t.value === value);
    if (idx === -1) return;
    const next = event.key === "ArrowRight" ? (idx + 1) % enabled.length : (idx - 1 + enabled.length) % enabled.length;
    onChange(enabled[next]!.value);
    event.preventDefault();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "no-scrollbar flex overflow-x-auto",
        variant === "underline"
          ? "gap-1 border-b border-slate-200 dark:border-slate-800"
          : "w-fit gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.value)}
            className={cn(
              "ok-focus inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:opacity-50",
              variant === "underline"
                ? cn(
                    "-mb-px border-b-2 px-3 py-2.5",
                    active
                      ? "border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
                  )
                : cn(
                    "rounded-lg px-3 py-1.5",
                    active
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
                  ),
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] leading-none",
                  active ? "bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
