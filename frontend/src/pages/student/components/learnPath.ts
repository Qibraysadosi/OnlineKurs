import type { Enrollment } from "@/types";

/** Link into the learn page, resuming at the last touched lesson when known. */
export function learnPathFor(enrollment: Enrollment): string {
  const base = `/learn/${enrollment.course.slug}`;
  return enrollment.last_lesson_id ? `${base}?lesson=${enrollment.last_lesson_id}` : base;
}
