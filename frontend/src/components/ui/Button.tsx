import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "gradient" | "inverse" | "inverseOutline";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, disables the button and keeps its width stable */
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Stretches to the container width */
  fullWidth?: boolean;
}

export const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800 dark:bg-primary-500 dark:hover:bg-primary-400",
  gradient: "ok-gradient-bg text-white shadow-sm hover:opacity-90 hover:shadow-glow active:opacity-100",
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
  outline:
    "border border-slate-300 bg-transparent text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
  danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800",
  // For use on brand-coloured surfaces (CTA banner); intentionally theme-independent.
  inverse: "bg-white text-primary-700 shadow-sm hover:bg-white/90 active:bg-white/80",
  inverseOutline: "border border-white/40 bg-white/10 text-white hover:bg-white/20 active:bg-white/30",
};

export const buttonSizes: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-xs gap-1 rounded-lg",
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
};

/** Class string for anchor/Link elements that should look like a button. */
export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: Pick<ButtonProps, "variant" | "size" | "fullWidth" | "className"> = {}): string {
  return cn(
    "ok-focus inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-60",
    buttonVariants[variant],
    buttonSizes[size],
    fullWidth && "w-full",
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, leftIcon, rightIcon, fullWidth, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? <Spinner size={size === "lg" ? "sm" : "xs"} className="text-current" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only buttons must describe themselves */
  "aria-label": string;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const ICON_SIZES = { sm: "h-8 w-8 rounded-lg", md: "h-10 w-10 rounded-xl", lg: "h-12 w-12 rounded-xl" };

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = "ghost", size = "md", loading, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "ok-focus inline-flex shrink-0 items-center justify-center transition-all duration-200 disabled:pointer-events-none disabled:opacity-60",
        buttonVariants[variant],
        ICON_SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size="xs" className="text-current" /> : children}
    </button>
  );
});
