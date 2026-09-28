import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface LogoMarkProps {
  className?: string;
  /** Hide the wordmark, keep the gradient mark */
  compact?: boolean;
}

/** Gradient mark + wordmark with no link, safe to render outside the router (boot splash). */
export function LogoMark({ className, compact }: LogoMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="ok-gradient-bg flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm" aria-hidden="true">
        <GraduationCap className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Online<span className="ok-gradient-text">Kurs</span>
        </span>
      )}
    </span>
  );
}

export interface LogoProps extends LogoMarkProps {
  to?: string;
}

export function Logo({ className, compact, to = "/" }: LogoProps) {
  return (
    <Link to={to} aria-label="OnlineKurs — bosh sahifa" className={cn("ok-focus inline-flex rounded-lg", className)}>
      <LogoMark compact={compact} />
    </Link>
  );
}
