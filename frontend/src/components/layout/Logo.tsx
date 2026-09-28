import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  /** Hide the wordmark, keep the gradient mark */
  compact?: boolean;
  to?: string;
}

export function Logo({ className, compact, to = "/" }: LogoProps) {
  return (
    <Link to={to} aria-label="OnlineKurs — bosh sahifa" className={cn("ok-focus inline-flex items-center gap-2 rounded-lg", className)}>
      <span className="ok-gradient-bg flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm" aria-hidden="true">
        <GraduationCap className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Online<span className="ok-gradient-text">Kurs</span>
        </span>
      )}
    </Link>
  );
}
