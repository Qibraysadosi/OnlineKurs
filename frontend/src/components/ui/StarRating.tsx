import { Star } from "lucide-react";
import { useState } from "react";
import { cn, formatRating } from "@/lib/utils";

export interface StarRatingProps {
  /** 0..5, fractional allowed in display mode */
  value: number;
  /** When provided the component becomes an interactive input (1..5 integers) */
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  /** Show "4.5" next to the stars */
  showValue?: boolean;
  /** Show "(12)" after the value */
  count?: number;
  className?: string;
  disabled?: boolean;
  label?: string;
}

const SIZES = { sm: "h-3.5 w-3.5", md: "h-[18px] w-[18px]", lg: "h-7 w-7" };

/** Display or input star rating. Display mode renders partial fills. */
export function StarRating({ value, onChange, size = "sm", showValue, count, className, disabled, label = "Baho" }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = Boolean(onChange) && !disabled;
  const shown = hover ?? value;

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div
        role={interactive ? "radiogroup" : "img"}
        aria-label={interactive ? label : `${label}: ${formatRating(value)} / 5`}
        className={cn("inline-flex items-center", interactive ? "gap-0.5" : "gap-0")}
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.max(0, Math.min(1, shown - (star - 1)));
          const StarIcon = (
            <span className={cn("relative inline-block", SIZES[size])}>
              <Star className={cn("absolute inset-0 h-full w-full text-slate-300 dark:text-slate-600")} aria-hidden="true" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn(SIZES[size], "fill-amber-400 text-amber-400")} aria-hidden="true" />
              </span>
            </span>
          );
          if (!interactive) return <span key={star}>{StarIcon}</span>;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} yulduz`}
              onMouseEnter={() => setHover(star)}
              onFocus={() => setHover(star)}
              onBlur={() => setHover(null)}
              onClick={() => onChange?.(star)}
              className="ok-focus rounded-sm transition-transform hover:scale-110"
            >
              {StarIcon}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium tabular-nums text-slate-800 dark:text-slate-200">{formatRating(value)}</span>
      )}
      {count !== undefined && <span className="text-xs text-slate-500 dark:text-slate-400">({count})</span>}
    </div>
  );
}
