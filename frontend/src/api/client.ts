import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import type { ApiError, Tokens, UploadProgress } from "@/types";

export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";
export const API_BASE = `${API_URL.replace(/\/$/, "")}/api`;

const ACCESS_KEY = "ok_access";
const REFRESH_KEY = "ok_refresh";

/** Fired on `window` when the session cannot be restored (refresh failed). */
export const LOGOUT_EVENT = "ok:logout";

export const tokenStorage = {
  getAccess(): string | null {
    try {
      return localStorage.getItem(ACCESS_KEY);
    } catch {
      return null;
    }
  },
  getRefresh(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  set(tokens: Pick<Tokens, "access_token" | "refresh_token">): void {
    try {
      localStorage.setItem(ACCESS_KEY, tokens.access_token);
      localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    } catch {
      /* storage unavailable (private mode) */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * Exchanges the stored refresh token for a new pair. Concurrent 401s share one
 * in-flight refresh. Resolves to the new access token or null on failure.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return null;

  refreshPromise = axios
    .post<Tokens>(`${API_BASE}/auth/refresh`, { refresh_token: refresh })
    .then((res) => {
      tokenStorage.set(res.data);
      return res.data.access_token;
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

function emitLogout(): void {
  tokenStorage.clear();
  window.dispatchEvent(new CustomEvent(LOGOUT_EVENT));
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    const isRefreshCall = original?.url?.includes("/auth/refresh");
    const isLoginCall = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/register");

    if (status === 401 && original && !original._retry && !isRefreshCall && !isLoginCall) {
      original._retry = true;
      const hadSession = Boolean(tokenStorage.getRefresh());
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      if (hadSession) emitLogout();
    }
    return Promise.reject(error);
  },
);

/** Extracts the Uzbek `detail` message from an API error, with a fallback. */
export function getErrorMessage(error: unknown, fallback = "Xatolik yuz berdi. Qayta urinib ko'ring."): string {
  if (axios.isAxiosError<ApiError>(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail)) {
      const first = (detail as Array<{ msg?: string }>)[0];
      if (first?.msg) return first.msg;
    }
    if (error.code === "ECONNABORTED") return "So'rov vaqti tugadi. Internetni tekshiring.";
    if (!error.response) return "Server bilan aloqa yo'q. Backend ishga tushganini tekshiring.";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Builds a multipart config with an optional upload-progress callback. */
export function multipart(onProgress?: UploadProgress): AxiosRequestConfig {
  return {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 0,
    onUploadProgress: (evt) => {
      if (!onProgress) return;
      const total = evt.total ?? 0;
      const percent = total > 0 ? Math.round((evt.loaded * 100) / total) : 0;
      onProgress(Math.min(100, percent));
    },
  };
}

export function fileForm(file: File): FormData {
  const form = new FormData();
  form.append("file", file);
  return form;
}

/** Drops undefined / empty-string params so URLs stay clean. */
export function cleanParams<T extends object>(params: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    (out as Record<string, unknown>)[key] = value;
  }
  return out;
}
