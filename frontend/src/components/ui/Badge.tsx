import { type HTMLAttributes, type ReactNode } from "react";
import { cn, type BadgeTone } from "@/lib/utils";

export type { BadgeTone };

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: "sm" | "md";
  /** Colored dot before the text */
  dot?: boolean;
  icon?: ReactNode;
}

export const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  primary: "bg-primary-50 text-primary-700 ring-primary-200 dark:bg-primary-950/60 dark:text-primary-300 dark:ring-primary-900",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900",
  warning: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900",
  danger: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-900",
  info: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-900",
};

const DOT_COLORS: Record<BadgeTone, string> = {
  neutral: "bg-slate-400",
  primary: "bg-primary-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
};

export function Badge({ tone = "neutral", size = "sm", dot, icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        badgeTones[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT_COLORS[tone])} aria-hidden="true" />}
      {icon}
      {children}
    </span>
  );
}
