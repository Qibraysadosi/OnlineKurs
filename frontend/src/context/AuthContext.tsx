import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "@/api/auth";
import { LOGOUT_EVENT, tokenStorage } from "@/api/client";
import type { LoginPayload, RegisterPayload, Role, UserPublic } from "@/types";

interface AuthContextValue {
  user: UserPublic | null;
  /** True while the initial `/auth/me` request is in flight (splash is shown). */
  isLoading: boolean;
  isAuthenticated: boolean;
  role: Role | null;
  isStudent: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  /** Teacher or admin (admins can do everything teachers can). */
  canTeach: boolean;
  login: (payload: LoginPayload) => Promise<UserPublic>;
  register: (payload: RegisterPayload) => Promise<UserPublic>;
  logout: () => void;
  /** Replace the cached user (e.g. after PATCH /auth/me or avatar upload). */
  setUser: (user: UserPublic) => void;
  /** Re-fetch `/auth/me` and update the cached user. */
  refreshUser: () => Promise<UserPublic | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUserState] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(tokenStorage.getAccess() || tokenStorage.getRefresh()));

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUserState(null);
    queryClient.clear();
  }, [queryClient]);

  // Restore session on boot.
  useEffect(() => {
    let cancelled = false;
    if (!tokenStorage.getAccess() && !tokenStorage.getRefresh()) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then((me) => {
        if (!cancelled) setUserState(me);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // The axios client emits this when a refresh fails.
  useEffect(() => {
    const handler = () => {
      setUserState(null);
      queryClient.clear();
    };
    window.addEventListener(LOGOUT_EVENT, handler);
    return () => window.removeEventListener(LOGOUT_EVENT, handler);
  }, [queryClient]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const tokens = await authApi.login(payload);
      tokenStorage.set(tokens);
      setUserState(tokens.user);
      return tokens.user;
    },
    [],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    const tokens = await authApi.register(payload);
    tokenStorage.set(tokens);
    setUserState(tokens.user);
    return tokens.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const setUser = useCallback((next: UserPublic) => {
    setUserState(next);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUserState(me);
      return me;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = user?.role ?? null;
    return {
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      role,
      isStudent: role === "student",
      isTeacher: role === "teacher",
      isAdmin: role === "admin",
      canTeach: role === "teacher" || role === "admin",
      login,
      register,
      logout,
      setUser,
      refreshUser,
    };
  }, [user, isLoading, login, register, logout, setUser, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
