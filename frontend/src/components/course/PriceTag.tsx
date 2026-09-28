import { cn, formatPrice } from "@/lib/utils";

export interface PriceTagProps {
  price: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "text-sm", md: "text-lg", lg: "text-3xl" };

/** "199 000 so'm" in bold, or an emerald "Bepul" pill for free courses. */
export function PriceTag({ price, size = "md", className }: PriceTagProps) {
  if (price <= 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900",
          size === "lg" ? "px-3 py-1 text-xl" : size === "md" ? "text-base" : "text-xs",
          className,
        )}
      >
        Bepul
      </span>
    );
  }
  return (
    <span className={cn("font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100", SIZES[size], className)}>
      {formatPrice(price)}
    </span>
  );
}
