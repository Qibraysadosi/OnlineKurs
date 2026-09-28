import { FileUp, X } from "lucide-react";
import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { cn, formatBytes } from "@/lib/utils";
import { ProgressBar } from "./ProgressBar";

export interface FileDropzoneProps {
  /** Called with the chosen file (single-file only) */
  onFile: (file: File) => void;
  /** e.g. "image/*" or ".pdf,.zip,.docx" */
  accept?: string;
  /** Max size in bytes; larger files are rejected with an inline message */
  maxSize?: number;
  /** Upload progress 0..100; when defined a progress bar is shown and the zone is disabled */
  progress?: number;
  /** Optional currently-selected file to display (name + size) */
  file?: File | null;
  onClear?: () => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}

export function FileDropzone({
  onFile,
  accept,
  maxSize,
  progress,
  file,
  onClear,
  label = "Faylni tanlang yoki shu yerga tashlang",
  hint,
  error,
  disabled,
  className,
  icon,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputId = useId();
  const uploading = progress !== undefined;
  const isDisabled = disabled || uploading;

  const handleFile = (candidate: File | undefined) => {
    if (!candidate) return;
    if (maxSize && candidate.size > maxSize) {
      setLocalError(`Fayl hajmi ${formatBytes(maxSize)} dan oshmasligi kerak`);
      return;
    }
    setLocalError(null);
    onFile(candidate);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (isDisabled) return;
    handleFile(event.dataTransfer.files?.[0]);
  };

  const shownError = error ?? localError;

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled || undefined}
        onClick={() => !isDisabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDisabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "ok-focus flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200",
          dragging
            ? "border-primary-500 bg-primary-50 dark:bg-primary-950/40"
            : "border-slate-300 bg-slate-50 hover:border-primary-400 hover:bg-primary-50/50 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-primary-500 dark:hover:bg-primary-950/30",
          shownError && "border-rose-400 dark:border-rose-700",
          isDisabled && "cursor-not-allowed opacity-70",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          disabled={isDisabled}
          className="sr-only"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary-500 shadow-sm dark:bg-slate-800" aria-hidden="true">
          {icon ?? <FileUp className="h-6 w-6" />}
        </span>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        {maxSize && !hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Maksimal hajm: {formatBytes(maxSize)}</p>}
      </div>

      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="min-w-0 flex-1 truncate text-slate-800 dark:text-slate-200">{file.name}</span>
          <span className="shrink-0 text-xs text-slate-500">{formatBytes(file.size)}</span>
          {onClear && !uploading && (
            <button type="button" onClick={onClear} aria-label="Faylni olib tashlash" className="ok-focus rounded-md p-1 text-slate-400 hover:text-rose-500">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {uploading && (
        <div className="mt-3">
          <ProgressBar value={progress} showLabel label="Yuklash jarayoni" />
        </div>
      )}

      {shownError && (
        <p role="alert" className="mt-2 text-xs text-rose-600 dark:text-rose-400">
          {shownError}
        </p>
      )}
    </div>
  );
}
