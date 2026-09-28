import { AlertTriangle } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Modal } from "./Modal";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called when the user confirms; may be async. Dialog closes itself on resolve. */
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** "danger" renders a red confirm button (default for deletions) */
  tone?: "danger" | "primary";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Tasdiqlash",
  cancelText = "Bekor qilish",
  tone = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" closeOnOverlay={!loading}>
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            tone === "danger"
              ? "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
              : "bg-primary-100 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300",
          )}
          aria-hidden="true"
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          {description && <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        <div className="mt-2 grid w-full grid-cols-2 gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={handleConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
