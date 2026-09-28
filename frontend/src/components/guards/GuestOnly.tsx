import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import { PageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

/** Route wrapper for /login and /register: signed-in users are sent to `?next=` or /dashboard. */
export function GuestOnly() {
  const { isAuthenticated, isLoading } = useAuth();
  const [params] = useSearchParams();
  if (isLoading) return <PageSpinner />;
  if (isAuthenticated) {
    const next = params.get("next");
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    return <Navigate to={safeNext} replace />;
  }
  return <Outlet />;
}
