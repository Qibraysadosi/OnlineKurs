import { Check } from "lucide-react";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FieldMessage } from "./FormField";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  description?: string;
  error?: string;
  containerClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, error, containerClassName, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={containerClassName}>
      <label htmlFor={inputId} className="flex cursor-pointer items-start gap-3">
        <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={cn(
              "ok-focus peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white transition-all checked:border-primary-600 checked:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900",
              className,
            )}
            {...rest}
          />
          <Check
            className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
            strokeWidth={3}
            aria-hidden="true"
          />
        </span>
        {(label || description) && (
          <span className="min-w-0">
            {label && <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span>}
            {description && <span className="block text-xs text-slate-500 dark:text-slate-400">{description}</span>}
          </span>
        )}
      </label>
      <FieldMessage error={error} />
    </div>
  );
});

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  id?: string;
  /** Required when no `label` is given */
  "aria-label"?: string;
}

export function Switch({ checked, onChange, label, description, disabled, size = "md", className, id, ...rest }: SwitchProps) {
  const autoId = useId();
  const switchId = id ?? autoId;
  const track = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const knob = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const shift = size === "sm" ? "translate-x-4" : "translate-x-5";
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={rest["aria-label"]}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "ok-focus relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
          track,
          checked ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-700",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block translate-x-0.5 rounded-full bg-white shadow transition-transform duration-200",
            knob,
            checked && shift,
          )}
        />
      </button>
      {(label || description) && (
        <label htmlFor={switchId} className="min-w-0 cursor-pointer">
          {label && <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span>}
          {description && <span className="block text-xs text-slate-500 dark:text-slate-400">{description}</span>}
        </label>
      )}
    </div>
  );
}
