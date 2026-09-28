import { cn } from "@/lib/utils";

export interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Accessible label (default "Yuklanmoqda") */
  label?: string;
}

const SIZES = { xs: "h-3 w-3 border-2", sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-10 w-10 border-[3px]" };

export function Spinner({ size = "md", className, label = "Yuklanmoqda" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent text-primary-500",
        SIZES[size],
        className,
      )}
    />
  );
}

/** Centered spinner filling its container; use for page-level loading. */
export function PageSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full items-center justify-center py-24", className)}>
      <Spinner size="lg" />
    </div>
  );
}
