import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
  duration: number;
}

export interface ToastOptions {
  /** Secondary line under the title */
  description?: string;
  /** Auto-dismiss delay in ms (default 4000, errors 6000). 0 keeps it until closed. */
  duration?: number;
}

/** Imperative API. Its identity never changes, so it is safe in effect dependency arrays. */
export interface ToastApi {
  show: (kind: ToastKind, title: string, options?: ToastOptions) => number;
  success: (title: string, options?: ToastOptions) => number;
  error: (title: string, options?: ToastOptions) => number;
  info: (title: string, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

// Two contexts: the API is stable, the list changes with every toast. Only <Toaster>
// subscribes to the list, so showing a toast never re-renders (or re-runs effects in)
// the components that triggered it.
const ToastApiContext = createContext<ToastApi | null>(null);
const ToastListContext = createContext<ToastItem[] | null>(null);

const MAX_VISIBLE = 5;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((kind: ToastKind, title: string, options: ToastOptions = {}) => {
    const id = ++counter.current;
    const duration = options.duration ?? (kind === "error" ? 6000 : 4000);
    setToasts((prev) => [...prev, { id, kind, title, description: options.description, duration }].slice(-MAX_VISIBLE));
    return id;
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, options) => show("success", title, options),
      error: (title, options) => show("error", title, options),
      info: (title, options) => show("info", title, options),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastApiContext.Provider value={api}>
      <ToastListContext.Provider value={toasts}>{children}</ToastListContext.Provider>
    </ToastApiContext.Provider>
  );
}

export function useToastContext(): ToastApi {
  const ctx = useContext(ToastApiContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

function useToastList(): ToastItem[] {
  const ctx = useContext(ToastListContext);
  if (!ctx) throw new Error("Toaster must be used inside <ToastProvider>");
  return ctx;
}

const KIND_STYLES: Record<ToastKind, { icon: typeof Info; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: "border-emerald-200 dark:border-emerald-900", iconColor: "text-emerald-500" },
  error: { icon: AlertCircle, ring: "border-rose-200 dark:border-rose-900", iconColor: "text-rose-500" },
  info: { icon: Info, ring: "border-primary-200 dark:border-primary-900", iconColor: "text-primary-500" },
};

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const { icon: Icon, ring, iconColor } = KIND_STYLES[toast.kind];

  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = window.setTimeout(onClose, toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.duration, onClose]);

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-white/95 p-4 shadow-lg backdrop-blur animate-in-right dark:bg-slate-900/95",
        ring,
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconColor)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Yopish"
        className="ok-focus -m-1 rounded-md p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Renders the stacked toast list (bottom-right). Mounted once in App.tsx. */
export function Toaster() {
  const toasts = useToastList();
  const { dismiss } = useToastContext();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onClose={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}
