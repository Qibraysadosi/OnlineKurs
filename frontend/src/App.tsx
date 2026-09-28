import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "@/components/guards/ErrorBoundary";
import { Logo } from "@/components/layout/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster, ToastProvider } from "@/context/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import { router } from "@/router";

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Never retry client errors (401/403/404/409/422); retry network/5xx once.
          if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status !== undefined && status < 500) return false;
          }
          return failureCount < 1;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/** Full-screen splash shown while `/auth/me` restores the session on boot. */
function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-950">
      <Logo />
      <Spinner size="lg" />
    </div>
  );
}

function AppRoutes() {
  const { isLoading } = useAuth();
  if (isLoading) return <Splash />;
  return <RouterProvider router={router} />;
}

export default function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              <AppRoutes />
              <Toaster />
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
