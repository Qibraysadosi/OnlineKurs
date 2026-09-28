import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useQueryParams } from "@/hooks/useQueryParams";

/**
 * Text input state that mirrors a URL search param with a debounce.
 * Typing updates the input immediately, the URL after `delay` ms (and resets `page`);
 * an external URL change (back button) syncs the input.
 */
export function useDebouncedSearchParam(key = "q", delay = 350): [string, (value: string) => void] {
  const { get, setMany } = useQueryParams();
  const urlValue = get(key);
  const [value, setValue] = useState(urlValue);
  const debounced = useDebounce(value, delay);
  const lastSynced = useRef(urlValue);

  useEffect(() => {
    const next = debounced.trim();
    if (next === lastSynced.current) return;
    lastSynced.current = next;
    setMany({ [key]: next, page: null });
  }, [debounced, key, setMany]);

  useEffect(() => {
    if (urlValue === lastSynced.current) return;
    lastSynced.current = urlValue;
    setValue(urlValue);
  }, [urlValue]);

  return [value, setValue];
}
