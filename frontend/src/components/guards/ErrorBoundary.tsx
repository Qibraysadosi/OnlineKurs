import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback; receives a reset callback */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Resets the boundary when this value changes (e.g. `location.pathname`) */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", error, info.componentStack);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.reset();
    }
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return <ErrorFallback error={error} onRetry={this.reset} />;
  }
}

export interface ErrorFallbackProps {
  error?: Error | null;
  /** Message shown under the title (default: generic Uzbek text) */
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/** Reusable error panel with retry; also handy for failed React Query requests. */
export function ErrorFallback({ error, message, onRetry, className }: ErrorFallbackProps) {
  return (
    <div className={className ?? "flex min-h-[50vh] items-center justify-center px-4 py-16"}>
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400" aria-hidden="true">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Xatolik yuz berdi</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {message ?? "Sahifani yuklashda kutilmagan xatolik. Qayta urinib ko'ring."}
        </p>
        {import.meta.env.DEV && error && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-slate-100 p-3 text-left text-xs text-rose-700 dark:bg-slate-900 dark:text-rose-300">
            {error.message}
          </pre>
        )}
        {onRetry && (
          <Button className="mt-6" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={onRetry}>
            Qayta urinish
          </Button>
        )}
      </div>
    </div>
  );
}
