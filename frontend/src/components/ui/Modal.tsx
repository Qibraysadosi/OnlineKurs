import { X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDialogBehaviour } from "@/hooks/useDialogBehaviour";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn } from "@/lib/utils";
import { IconButton } from "./Button";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Buttons row rendered at the bottom */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Disallow closing via ESC / overlay (e.g. while submitting) */
  closeOnOverlay?: boolean;
  /** Extra classes for the panel */
  className?: string;
}

const SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

export function Modal({ open, onClose, title, description, children, footer, size = "md", closeOnOverlay = true, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useLockBodyScroll(open);
  useDialogBehaviour(open, onClose, panelRef, { closeOnEscape: closeOnOverlay });

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="presentation">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-in"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "ok-focus relative flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl animate-in-scale dark:border-slate-800 dark:bg-slate-900 sm:rounded-2xl",
          SIZES[size],
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h2>
              )}
              {description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
            <IconButton aria-label="Yopish" size="sm" onClick={onClose} className="-mr-2 -mt-1">
              <X className="h-5 w-5" aria-hidden="true" />
            </IconButton>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
