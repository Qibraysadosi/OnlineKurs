import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types";

export interface RequireRoleProps {
  roles: Role[];
  /** Where to send authenticated users without the role (default `/dashboard`) */
  fallback?: string;
}

/** Route wrapper: guests go to login, wrong roles go to `fallback`. Admin always passes. */
export function RequireRole({ roles, fallback = "/dashboard" }: RequireRoleProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageSpinner />;
  if (!isAuthenticated || !user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  const allowed = user.role === "admin" || roles.includes(user.role);
  if (!allowed) return <Navigate to={fallback} replace />;
  return <Outlet />;
}
