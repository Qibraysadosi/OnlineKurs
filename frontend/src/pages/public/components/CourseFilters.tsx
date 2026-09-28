import { Check } from "lucide-react";
import { type ReactNode } from "react";
import { CategoryIcon } from "@/components/course/CategoryIcon";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, LEVEL_LABELS } from "@/lib/utils";
import type { Category, CourseLevel, PriceFilter } from "@/types";

export interface FilterValues {
  category: string;
  level: CourseLevel | "";
  price: PriceFilter | "";
}

export interface CourseFiltersProps {
  categories: Category[];
  categoriesLoading: boolean;
  values: FilterValues;
  onChange: (patch: Partial<FilterValues>) => void;
  className?: string;
}

export const PRICE_LABELS: Record<PriceFilter, string> = { free: "Bepul", paid: "Pullik" };

interface OptionRowProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: ReactNode;
  count?: number;
}

function OptionRow({ active, onClick, label, icon, count }: OptionRowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          "ok-focus flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors",
          active
            ? "bg-primary-50 font-medium text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70",
        )}
      >
        <span
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
            active ? "border-primary-600 bg-primary-600 text-white dark:border-primary-400 dark:bg-primary-400" : "border-slate-300 dark:border-slate-600",
          )}
          aria-hidden="true"
        >
          {active && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
        {icon}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {count !== undefined && <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{count}</span>}
      </button>
    </li>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</legend>
      <ul className="space-y-0.5">{children}</ul>
    </fieldset>
  );
}

/** Category / level / price option lists. Rendered in the desktop sidebar and inside the mobile filter modal. */
export function CourseFilters({ categories, categoriesLoading, values, onChange, className }: CourseFiltersProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <FilterGroup title="Yo'nalish">
        {categoriesLoading ? (
          <li aria-hidden="true" className="space-y-1.5">
            <Skeleton className="h-9 w-full" count={5} />
          </li>
        ) : (
          <>
            <OptionRow active={values.category === ""} onClick={() => onChange({ category: "" })} label="Barchasi" />
            {categories.map((category) => (
              <OptionRow
                key={category.id}
                active={values.category === category.slug}
                onClick={() => onChange({ category: category.slug })}
                label={category.name}
                icon={<CategoryIcon name={category.icon} className="h-4 w-4 shrink-0 text-slate-400" />}
                count={category.courses_count}
              />
            ))}
          </>
        )}
      </FilterGroup>

      <FilterGroup title="Daraja">
        <OptionRow active={values.level === ""} onClick={() => onChange({ level: "" })} label="Barchasi" />
        {(Object.entries(LEVEL_LABELS) as [CourseLevel, string][]).map(([value, label]) => (
          <OptionRow key={value} active={values.level === value} onClick={() => onChange({ level: value })} label={label} />
        ))}
      </FilterGroup>

      <FilterGroup title="Narx">
        <OptionRow active={values.price === ""} onClick={() => onChange({ price: "" })} label="Barchasi" />
        {(Object.entries(PRICE_LABELS) as [PriceFilter, string][]).map(([value, label]) => (
          <OptionRow key={value} active={values.price === value} onClick={() => onChange({ price: value })} label={label} />
        ))}
      </FilterGroup>
    </div>
  );
}
