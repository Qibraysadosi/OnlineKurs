import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export type QueryParamValue = string | number | boolean | null | undefined;

/**
 * Typed helper over `useSearchParams`.
 *
 * ```ts
 * const { params, get, getNumber, set, setMany, remove } = useQueryParams();
 * const page = getNumber("page", 1);
 * set("q", "python");          // replaces `q` and resets nothing else
 * setMany({ q: "python", page: 1 });
 * ```
 * Setting `""`, `null` or `undefined` removes the key.
 */
export function useQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  const get = useCallback((key: string, fallback = ""): string => searchParams.get(key) ?? fallback, [searchParams]);

  const getNumber = useCallback(
    (key: string, fallback: number): number => {
      const raw = searchParams.get(key);
      if (raw === null || raw === "") return fallback;
      const num = Number(raw);
      return Number.isFinite(num) ? num : fallback;
    },
    [searchParams],
  );

  const getBoolean = useCallback(
    (key: string, fallback = false): boolean => {
      const raw = searchParams.get(key);
      if (raw === null) return fallback;
      return raw === "true" || raw === "1";
    },
    [searchParams],
  );

  const setMany = useCallback(
    (updates: Record<string, QueryParamValue>, options: { replace?: boolean } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === undefined || value === "" || value === false) {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }
          return next;
        },
        { replace: options.replace ?? true },
      );
    },
    [setSearchParams],
  );

  const set = useCallback(
    (key: string, value: QueryParamValue, options?: { replace?: boolean }) => setMany({ [key]: value }, options),
    [setMany],
  );

  const remove = useCallback((...keys: string[]) => {
    setMany(Object.fromEntries(keys.map((k) => [k, null])));
  }, [setMany]);

  const clear = useCallback(() => setSearchParams(new URLSearchParams(), { replace: true }), [setSearchParams]);

  return { params, searchParams, get, getNumber, getBoolean, set, setMany, remove, clear };
}
