import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Outlet, useLocation, type RouteObject } from "react-router-dom";
import { ErrorBoundary } from "@/components/guards/ErrorBoundary";
import { GuestOnly } from "@/components/guards/GuestOnly";
import { RequireAuth } from "@/components/guards/RequireAuth";
import { RequireRole } from "@/components/guards/RequireRole";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LearnLayout } from "@/components/layout/LearnLayout";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageSpinner } from "@/components/ui/Spinner";

const NotFoundPage = lazy(() => import("@/pages/public/NotFoundPage"));

/** Wraps lazily-loaded pages with Suspense so each route group is code-split. */
export function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageSpinner />}>{children}</Suspense>;
}

/** Root element: error boundary that resets on navigation. */
function RootBoundary() {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Outlet />
    </ErrorBoundary>
  );
}

/*
 * Integrator guide — add pages here, keeping the groups separate:
 *
 *   const HomePage = lazy(() => import("@/pages/public/HomePage"));
 *   publicRoutes.push({ index: true, element: <Lazy><HomePage /></Lazy> });
 *
 * Each array below is mounted under the layout/guard combination named in its comment.
 */

/** Public pages under <MainLayout> (navbar + footer), no auth needed. */
export const publicRoutes: RouteObject[] = [];

/** Guest-only pages under <MainLayout> + <GuestOnly> (login, register). */
export const guestRoutes: RouteObject[] = [];

/** Signed-in pages under <DashboardLayout> + <RequireAuth> (dashboard, my-courses, profile, payments, checkout). */
export const studentRoutes: RouteObject[] = [];

/** Full-height learning pages under <LearnLayout> + <RequireAuth> (learn/:slug). */
export const learnRoutes: RouteObject[] = [];

/** Teacher pages under <DashboardLayout> + <RequireRole roles={["teacher"]}> (admin passes too). */
export const teacherRoutes: RouteObject[] = [];

/** Admin pages under <DashboardLayout> + <RequireRole roles={["admin"]}>. */
export const adminRoutes: RouteObject[] = [];

export const router = createBrowserRouter([
  {
    element: <RootBoundary />,
    children: [
      {
        element: <MainLayout />,
        children: [
          ...publicRoutes,
          {
            element: <GuestOnly />,
            children: guestRoutes,
          },
          {
            path: "*",
            element: (
              <Lazy>
                <NotFoundPage />
              </Lazy>
            ),
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          { element: <DashboardLayout />, children: studentRoutes },
          { element: <LearnLayout />, children: learnRoutes },
        ],
      },
      {
        element: <RequireRole roles={["teacher"]} />,
        children: [{ element: <DashboardLayout />, children: teacherRoutes }],
      },
      {
        element: <RequireRole roles={["admin"]} />,
        children: [{ element: <DashboardLayout />, children: adminRoutes }],
      },
    ],
  },
]);
