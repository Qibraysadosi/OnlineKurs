import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export interface DialogBehaviourOptions {
  /** Close on Escape (turn off while a submit is in flight). Default true. */
  closeOnEscape?: boolean;
}

/**
 * Keyboard/focus contract for anything rendered with role="dialog" aria-modal="true":
 * moves focus into the panel when it opens, closes on Escape, keeps Tab / Shift+Tab inside
 * the panel and restores the previously focused element on close.
 * The panel element should carry `tabIndex={-1}` so it can receive focus itself when empty.
 */
export function useDialogBehaviour(open: boolean, onClose: () => void, panelRef: RefObject<HTMLElement>, { closeOnEscape = true }: DialogBehaviourOptions = {}) {
  // Read the latest callback from a ref so an inline `onClose` never re-runs the effect
  // (re-running would steal focus from whatever the user is typing in).
  // Same for `closeOnEscape`: callers toggle it with their busy flag on every submit/upload.
  const onCloseRef = useRef(onClose);
  const closeOnEscapeRef = useRef(closeOnEscape);
  useEffect(() => {
    onCloseRef.current = onClose;
    closeOnEscapeRef.current = closeOnEscape;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (closeOnEscapeRef.current) {
          event.stopPropagation();
          onCloseRef.current();
        }
        return;
      }
      if (event.key === "Tab" && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (items.length === 0) {
          event.preventDefault();
          panel.focus();
          return;
        }
        const firstEl = items[0]!;
        const lastEl = items[items.length - 1]!;
        const active = document.activeElement;
        const inside = active instanceof Node && panel.contains(active);
        if (event.shiftKey && (active === firstEl || !inside)) {
          event.preventDefault();
          lastEl.focus();
        } else if (!event.shiftKey && (active === lastEl || !inside)) {
          event.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, panelRef]);
}
