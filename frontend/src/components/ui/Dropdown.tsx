import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DropdownProps {
  /** The trigger; receives `open` so it can rotate a chevron etc. */
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
  /** Called after any click inside the menu closes it */
  closeOnClick?: boolean;
}

/** Click-outside + ESC aware dropdown panel (used by the user menu and row action menus). */
export function Dropdown({ trigger, children, align = "right", className, closeOnClick = true }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          role="menu"
          onClick={() => closeOnClick && setOpen(false)}
          className={cn(
            "absolute z-40 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-in-scale dark:border-slate-800 dark:bg-slate-900",
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  className?: string;
}

export function DropdownItem({ children, onClick, icon, danger, className }: DropdownItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "ok-focus flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        danger
          ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
        className,
      )}
    >
      {icon && <span className="text-slate-400" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div role="separator" className="my-1 h-px bg-slate-200 dark:bg-slate-800" />;
}
