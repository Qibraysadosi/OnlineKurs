import { useEffect } from "react";

/** Sets `document.title` to "<title> — OnlineKurs" while the component is mounted. */
export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — OnlineKurs` : "OnlineKurs";
    return () => {
      document.title = previous;
    };
  }, [title]);
}
