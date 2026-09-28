import { Search, X } from "lucide-react";
import { type ReactNode } from "react";
import { IconButton, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  /** Filter controls rendered to the right of the search box */
  children?: ReactNode;
  /** e.g. "12 ta foydalanuvchi" */
  summary?: ReactNode;
  className?: string;
}

/** Search box + filter controls row used above admin tables. */
export function ListToolbar({ search, onSearchChange, searchPlaceholder, children, summary, className }: ListToolbarProps) {
  return (
    <div className={cn("mb-5 space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          aria-label={searchPlaceholder}
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          rightElement={
            search ? (
              <IconButton aria-label="Qidiruvni tozalash" size="sm" onClick={() => onSearchChange("")}>
                <X className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            ) : undefined
          }
          containerClassName="sm:max-w-sm"
          className="[&::-webkit-search-cancel-button]:hidden"
        />
        {children && <div className="flex flex-wrap items-center gap-3 sm:ml-auto">{children}</div>}
      </div>
      {summary && <p className="text-sm text-slate-500 dark:text-slate-400">{summary}</p>}
    </div>
  );
}
