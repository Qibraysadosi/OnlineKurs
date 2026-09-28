import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { coursesApi, queryKeys } from "@/api";
import type { CourseDetail } from "@/types";

/** Local key: lives under the teacher prefix so `teacher.all` invalidation refreshes it. */
const lookupKey = (courseId: number) => [...queryKeys.teacher.all, "course-slug", courseId] as const;

export function useEditorCourse(courseId: number) {
  const queryClient = useQueryClient();

  /**
   * The editor route carries the course id while the rest of the app caches courses by slug.
   * One id lookup seeds the slug-keyed cache, so every later mutation can keep using
   * `queryKeys.course(slug)` exactly like the public and student pages do.
   */
  const slugQuery = useQuery({
    queryKey: lookupKey(courseId),
    queryFn: async () => {
      const course = await coursesApi.getById(courseId);
      queryClient.setQueryData(queryKeys.course(course.slug), course);
      return course.slug;
    },
    enabled: Number.isFinite(courseId) && courseId > 0,
    staleTime: Infinity,
  });

  const slug = slugQuery.data;

  const courseQuery = useQuery({
    queryKey: queryKeys.course(slug ?? ""),
    queryFn: () => coursesApi.get(slug as string),
    enabled: Boolean(slug),
  });

  /** Writes a fresh CourseDetail (returned by a mutation) into the cache and re-syncs dependents. */
  const applyCourse = useCallback(
    (course: CourseDetail) => {
      queryClient.setQueryData(queryKeys.course(course.slug), course);
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.teacher.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    [queryClient],
  );

  /** Updates only the curriculum in the cached course (section / lesson mutations). */
  const patchSections = useCallback(
    (courseSlug: string, updater: (course: CourseDetail) => CourseDetail) => {
      queryClient.setQueryData<CourseDetail>(queryKeys.course(courseSlug), (current) => (current ? updater(current) : current));
      void queryClient.invalidateQueries({ queryKey: queryKeys.course(courseSlug) });
    },
    [queryClient],
  );

  const isPending = slugQuery.isPending || (Boolean(slug) && courseQuery.isPending);
  const error = slugQuery.error ?? courseQuery.error;
  const refetch = () => {
    if (slugQuery.isError) void slugQuery.refetch();
    else void courseQuery.refetch();
  };

  return { course: courseQuery.data, isPending, error, refetch, applyCourse, patchSections };
}
