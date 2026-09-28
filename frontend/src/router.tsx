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

// Public
const HomePage = lazy(() => import("@/pages/public/HomePage"));
const CoursesPage = lazy(() => import("@/pages/public/CoursesPage"));
const CourseDetailPage = lazy(() => import("@/pages/public/CourseDetailPage"));
const LoginPage = lazy(() => import("@/pages/public/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/public/RegisterPage"));
const NotFoundPage = lazy(() => import("@/pages/public/NotFoundPage"));

// Student
const DashboardPage = lazy(() => import("@/pages/student/DashboardPage"));
const MyCoursesPage = lazy(() => import("@/pages/student/MyCoursesPage"));
const LearnPage = lazy(() => import("@/pages/student/LearnPage"));
const CheckoutPage = lazy(() => import("@/pages/student/CheckoutPage"));
const ProfilePage = lazy(() => import("@/pages/student/ProfilePage"));
const PaymentsPage = lazy(() => import("@/pages/student/PaymentsPage"));

// Teacher
const TeacherDashboardPage = lazy(() => import("@/pages/teacher/TeacherDashboardPage"));
const CourseEditorPage = lazy(() => import("@/pages/teacher/CourseEditorPage"));

// Admin
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminCoursesPage = lazy(() => import("@/pages/admin/AdminCoursesPage"));
const AdminPaymentsPage = lazy(() => import("@/pages/admin/AdminPaymentsPage"));
const AdminCategoriesPage = lazy(() => import("@/pages/admin/AdminCategoriesPage"));

/** Wraps lazily-loaded pages with Suspense so each route group is code-split. */
function Lazy({ children }: { children: ReactNode }) {
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

/** Public pages under <MainLayout> (navbar + footer), no auth needed. */
const publicRoutes: RouteObject[] = [
  { index: true, element: <Lazy><HomePage /></Lazy> },
  { path: "courses", element: <Lazy><CoursesPage /></Lazy> },
  { path: "courses/:slug", element: <Lazy><CourseDetailPage /></Lazy> },
];

/** Guest-only pages under <MainLayout> + <GuestOnly> (login, register). */
const guestRoutes: RouteObject[] = [
  { path: "login", element: <Lazy><LoginPage /></Lazy> },
  { path: "register", element: <Lazy><RegisterPage /></Lazy> },
];

/** Signed-in pages under <DashboardLayout> + <RequireAuth>. */
const studentRoutes: RouteObject[] = [
  { path: "dashboard", element: <Lazy><DashboardPage /></Lazy> },
  { path: "my-courses", element: <Lazy><MyCoursesPage /></Lazy> },
  { path: "checkout/:slug", element: <Lazy><CheckoutPage /></Lazy> },
  { path: "profile", element: <Lazy><ProfilePage /></Lazy> },
  { path: "payments", element: <Lazy><PaymentsPage /></Lazy> },
];

/** Full-height learning pages under <LearnLayout> + <RequireAuth>. */
const learnRoutes: RouteObject[] = [{ path: "learn/:slug", element: <Lazy><LearnPage /></Lazy> }];

/** Teacher pages under <DashboardLayout> + <RequireRole roles={["teacher"]}> (admin passes too). */
const teacherRoutes: RouteObject[] = [
  { path: "teacher", element: <Lazy><TeacherDashboardPage /></Lazy> },
  { path: "teacher/courses/new", element: <Lazy><CourseEditorPage /></Lazy> },
  { path: "teacher/courses/:id/edit", element: <Lazy><CourseEditorPage /></Lazy> },
];

/** Admin pages under <DashboardLayout> + <RequireRole roles={["admin"]}>. */
const adminRoutes: RouteObject[] = [
  { path: "admin", element: <Lazy><AdminDashboardPage /></Lazy> },
  { path: "admin/users", element: <Lazy><AdminUsersPage /></Lazy> },
  { path: "admin/courses", element: <Lazy><AdminCoursesPage /></Lazy> },
  { path: "admin/payments", element: <Lazy><AdminPaymentsPage /></Lazy> },
  { path: "admin/categories", element: <Lazy><AdminCategoriesPage /></Lazy> },
];

const routes: RouteObject[] = [
  {
    element: <RootBoundary />,
    children: [
      {
        element: <MainLayout />,
        children: [
          ...publicRoutes,
          { element: <GuestOnly />, children: guestRoutes },
          { path: "*", element: <Lazy><NotFoundPage /></Lazy> },
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
];

export const router = createBrowserRouter(routes, {
  // Opt into the v7 behaviours now so the upgrade is a no-op and the console stays quiet.
  future: {
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_relativeSplatPath: true,
    v7_skipActionErrorRevalidation: true,
  },
});
