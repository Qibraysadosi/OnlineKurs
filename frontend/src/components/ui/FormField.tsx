import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
}

export function Label({ htmlFor, children, required, className }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300", className)}>
      {children}
      {required && <span className="ml-0.5 text-rose-500" aria-hidden="true">*</span>}
    </label>
  );
}

export interface FieldMessageProps {
  id?: string;
  error?: string;
  hint?: string;
}

export function FieldMessage({ id, error, hint }: FieldMessageProps) {
  if (error) {
    return (
      <p id={id} role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
        {hint}
      </p>
    );
  }
  return null;
}

/** Shared control class for Input / Textarea / Select. */
export function controlClassName(hasError: boolean | undefined, className?: string): string {
  return cn(
    "ok-focus block w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
    hasError
      ? "border-rose-400 focus-visible:ring-rose-500 dark:border-rose-700"
      : "border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600",
    className,
  );
}
