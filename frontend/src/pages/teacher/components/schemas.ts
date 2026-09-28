import { z } from "zod";
import { priceSchema } from "@/lib/validation";
import type { CourseCreatePayload, CourseDetail, CourseLevel, LessonCreatePayload, LessonOut } from "@/types";

/** Zod schemas + form/payload mappers shared by the teacher editor forms. */

const LEVELS: [CourseLevel, ...CourseLevel[]] = ["beginner", "intermediate", "advanced"];

export const LANGUAGE_OPTIONS = [
  { value: "uz", label: "O'zbek" },
  { value: "ru", label: "Rus" },
  { value: "en", label: "Ingliz" },
];

const listItemSchema = z.object({ value: z.string().trim().max(200, "Juda uzun (maks. 200 belgi)") });

export const courseFormSchema = z.object({
  title: z.string().trim().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak").max(200, "Sarlavha 200 belgidan oshmasligi kerak"),
  short_description: z
    .string()
    .trim()
    .min(10, "Qisqa tavsif kamida 10 ta belgidan iborat bo'lishi kerak")
    .max(300, "Qisqa tavsif 300 belgidan oshmasligi kerak"),
  description: z.string().trim().min(10, "Tavsif kamida 10 ta belgidan iborat bo'lishi kerak").max(20000, "Tavsif juda uzun"),
  category_id: z.string(),
  level: z.enum(LEVELS, { errorMap: () => ({ message: "Darajani tanlang" }) }),
  price: priceSchema.max(1_000_000_000, "Narx juda katta"),
  language: z.string().min(2, "Tilni tanlang"),
  what_you_learn: z.array(listItemSchema).max(20, "Ko'pi bilan 20 ta band"),
  requirements: z.array(listItemSchema).max(20, "Ko'pi bilan 20 ta band"),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

export const EMPTY_COURSE_FORM: CourseFormValues = {
  title: "",
  short_description: "",
  description: "",
  category_id: "",
  level: "beginner",
  price: 0,
  language: "uz",
  what_you_learn: [{ value: "" }],
  requirements: [{ value: "" }],
};

const toItems = (list: string[]) => (list.length > 0 ? list.map((value) => ({ value })) : [{ value: "" }]);

export function courseToFormValues(course: CourseDetail): CourseFormValues {
  return {
    title: course.title,
    short_description: course.short_description,
    description: course.description,
    category_id: course.category ? String(course.category.id) : "",
    level: course.level,
    price: course.price,
    language: course.language,
    what_you_learn: toItems(course.what_you_learn),
    requirements: toItems(course.requirements),
  };
}

const cleanList = (items: { value: string }[]) => items.map((item) => item.value.trim()).filter(Boolean);

export function courseFormToPayload(values: CourseFormValues): CourseCreatePayload {
  return {
    title: values.title.trim(),
    short_description: values.short_description.trim(),
    description: values.description.trim(),
    category_id: values.category_id ? Number(values.category_id) : null,
    level: values.level,
    price: values.price,
    language: values.language,
    what_you_learn: cleanList(values.what_you_learn),
    requirements: cleanList(values.requirements),
  };
}

export const sectionTitleSchema = z.object({
  title: z.string().trim().min(1, "Bo'lim nomini kiriting").max(200, "Nom 200 belgidan oshmasligi kerak"),
});
export type SectionFormValues = z.infer<typeof sectionTitleSchema>;

export const lessonFormSchema = z.object({
  title: z.string().trim().min(1, "Dars nomini kiriting").max(200, "Nom 200 belgidan oshmasligi kerak"),
  description: z.string().trim().max(5000, "Tavsif 5000 belgidan oshmasligi kerak"),
  duration_minutes: z.coerce
    .number({ invalid_type_error: "Raqam kiriting" })
    .int("Butun son bo'lishi kerak")
    .min(0, "Manfiy bo'lishi mumkin emas")
    .max(10000, "Davomiylik juda katta"),
  is_free_preview: z.boolean(),
  video_url: z
    .string()
    .trim()
    .max(500, "Havola juda uzun")
    .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), "Havola http:// yoki https:// bilan boshlanishi kerak"),
});

export type LessonFormValues = z.infer<typeof lessonFormSchema>;

export const EMPTY_LESSON_FORM: LessonFormValues = {
  title: "",
  description: "",
  duration_minutes: 0,
  is_free_preview: false,
  video_url: "",
};

export function lessonToFormValues(lesson: LessonOut): LessonFormValues {
  return {
    title: lesson.title,
    description: lesson.description ?? "",
    duration_minutes: lesson.duration_minutes,
    is_free_preview: lesson.is_free_preview,
    video_url: lesson.video_url ?? "",
  };
}

/**
 * Builds the lesson payload. `video_url` is only sent when the teacher typed an
 * external link (uploaded files set it server-side), so an untouched field never
 * overwrites an uploaded video.
 */
export function lessonFormToPayload(values: LessonFormValues, includeVideoUrl: boolean): LessonCreatePayload {
  const description = values.description.trim();
  const payload: LessonCreatePayload = {
    title: values.title.trim(),
    description: description ? description : null,
    duration_minutes: values.duration_minutes,
    is_free_preview: values.is_free_preview,
  };
  const video = values.video_url.trim();
  if (includeVideoUrl && video) payload.video_url = video;
  return payload;
}
