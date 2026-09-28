import type { Enrollment } from "@/types";

/**
 * Link into the learn page. No `?lesson=` is pinned on purpose: `last_lesson_id` is the lesson the
 * student most recently *completed*, while LearnPage's default picks the first uncompleted lesson,
 * which is where "Davom etish" should resume.
 */
export function learnPathFor(enrollment: Enrollment): string {
  return `/learn/${enrollment.course.slug}`;
}
