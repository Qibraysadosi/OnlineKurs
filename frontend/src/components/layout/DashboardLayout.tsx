import { PanelLeft, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { roleLabel } from "@/lib/utils";
import { Container } from "./Container";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { navGroupsForRole } from "./navigation";

/**
 * Navbar + left role-aware sidebar (drawer on mobile) + page content.
 * Pages render inside a <Container>-like padded area; use <PageHeader> at the top.
 */
export function DashboardLayout() {
  const { user, role } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  useLockBodyScroll(drawerOpen);
  const groups = navGroupsForRole(role);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Container className="flex flex-1 gap-8 py-6 sm:py-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24 space-y-5">
            {user && (
              <div className="ok-card flex items-center gap-3 p-3">
                <Avatar src={user.avatar_url} name={user.full_name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user.full_name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{roleLabel(user.role)}</p>
                </div>
              </div>
            )}
            <Sidebar groups={groups} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              className="ok-focus inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <PanelLeft className="h-4 w-4" aria-hidden="true" />
              Menyu
            </button>
          </div>
          <div className="animate-in">
            <Outlet />
          </div>
        </div>
      </Container>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Boshqaruv menyusi">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col overflow-y-auto bg-white p-4 shadow-xl animate-in-left dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              {user && (
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user.full_name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{roleLabel(user.role)}</p>
                  </div>
                </div>
              )}
              <IconButton aria-label="Yopish" size="sm" onClick={() => setDrawerOpen(false)}>
                <X className="h-5 w-5" aria-hidden="true" />
              </IconButton>
            </div>
            <Sidebar groups={groups} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
