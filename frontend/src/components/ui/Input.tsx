import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { controlClassName, FieldMessage, Label } from "./FormField";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Custom element on the right (e.g. a show-password button) */
  rightElement?: ReactNode;
  containerClassName?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = { sm: "h-9", md: "h-10", lg: "h-12 text-base" };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightIcon, rightElement, containerClassName, className, id, required, size = "md", ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;

  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={controlClassName(Boolean(error), cn(SIZES[size], leftIcon && "pl-10", (rightIcon || rightElement) && "pr-10", className))}
          {...rest}
        />
        {rightElement ? (
          <span className="absolute inset-y-0 right-0 flex items-center pr-2">{rightElement}</span>
        ) : rightIcon ? (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            {rightIcon}
          </span>
        ) : null}
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
});
