import { clampPercent, cn } from "@/lib/utils";

export interface ProgressBarProps {
  /** 0..100 */
  value: number;
  size?: "xs" | "sm" | "md";
  /** Show "42%" to the right */
  showLabel?: boolean;
  /** "gradient" (brand) or "success" (emerald, e.g. when complete) */
  tone?: "gradient" | "primary" | "success";
  className?: string;
  label?: string;
}

const HEIGHTS = { xs: "h-1", sm: "h-1.5", md: "h-2.5" };
const TONES = { gradient: "ok-gradient-bg", primary: "bg-primary-500", success: "bg-emerald-500" };

export function ProgressBar({ value, size = "sm", showLabel, tone = "gradient", className, label = "Progress" }: ProgressBarProps) {
  const percent = clampPercent(value);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className={cn("w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800", HEIGHTS[size])}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", percent >= 100 && tone === "gradient" ? TONES.success : TONES[tone])}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-slate-600 dark:text-slate-400">
          {percent}%
        </span>
      )}
    </div>
  );
}
