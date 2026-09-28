import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "@/api";

type QueryKey = readonly unknown[];

/**
 * Returns a function that invalidates every admin query (lists + stats) and any
 * extra keys the mutation touched, e.g. `invalidate(queryKeys.categories)`.
 */
export function useInvalidateAdmin(): (...extra: QueryKey[]) => void {
  const queryClient = useQueryClient();
  return useCallback(
    (...extra: QueryKey[]) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      for (const key of extra) void queryClient.invalidateQueries({ queryKey: key });
    },
    [queryClient],
  );
}
