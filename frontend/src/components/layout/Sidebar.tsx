import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { NavGroup } from "./navigation";

export interface SidebarProps {
  groups: NavGroup[];
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ groups, onNavigate, className }: SidebarProps) {
  return (
    <nav aria-label="Boshqaruv navigatsiyasi" className={cn("flex flex-col gap-6", className)}>
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "ok-focus group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary-50 text-primary-700 shadow-sm dark:bg-primary-950/60 dark:text-primary-300"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-primary-600 dark:text-primary-300" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200")}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
