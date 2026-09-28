import type { AdminCoursesParams, AdminPaymentsParams, AdminUsersParams, CourseListParams, PaginationParams } from "@/types";

/**
 * Single source of truth for React Query keys. Always use these so
 * invalidation after mutations is predictable across pages.
 *
 * Invalidation cheatsheet:
 *   - after course create/update/publish/cover:  queryKeys.courses.all, queryKeys.course(slug), queryKeys.teacher.all
 *   - after section/lesson mutation:             queryKeys.course(slug)
 *   - after enroll / payment confirm:            queryKeys.course(slug), queryKeys.enrollments, queryKeys.payments
 *   - after lesson complete:                     queryKeys.course(slug), queryKeys.progress(courseId), queryKeys.enrollments
 *   - after review:                              queryKeys.reviews(courseId), queryKeys.course(slug)
 *   - after profile update:                      queryKeys.me
 *   - after admin mutation:                      the matching queryKeys.admin.* and queryKeys.admin.stats
 */
export const queryKeys = {
  me: ["me"] as const,
  categories: ["categories"] as const,
  courses: {
    all: ["courses"] as const,
    list: (params: CourseListParams) => ["courses", "list", params] as const,
    featured: ["courses", "featured"] as const,
  },
  course: (slug: string) => ["course", slug] as const,
  reviews: (courseId: number, params: PaginationParams = {}) => ["reviews", courseId, params] as const,
  progress: (courseId: number) => ["progress", courseId] as const,
  lesson: (id: number) => ["lesson", id] as const,
  enrollments: ["enrollments"] as const,
  payments: ["payments"] as const,
  teacher: {
    all: ["teacher"] as const,
    courses: ["teacher", "courses"] as const,
    stats: ["teacher", "stats"] as const,
  },
  admin: {
    all: ["admin"] as const,
    stats: ["admin", "stats"] as const,
    users: (params: AdminUsersParams = {}) => ["admin", "users", params] as const,
    courses: (params: AdminCoursesParams = {}) => ["admin", "courses", params] as const,
    payments: (params: AdminPaymentsParams = {}) => ["admin", "payments", params] as const,
  },
};
