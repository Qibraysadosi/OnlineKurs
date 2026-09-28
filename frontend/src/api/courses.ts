import { api, cleanParams, fileForm, multipart } from "./client";
import type {
  CourseCard,
  CourseCreatePayload,
  CourseDetail,
  CourseListParams,
  CourseProgress,
  CourseUpdatePayload,
  Enrollment,
  Paginated,
  PaginationParams,
  PublishPayload,
  Review,
  ReviewPayload,
  UploadProgress,
} from "@/types";

export const coursesApi = {
  list: async (params: CourseListParams = {}): Promise<Paginated<CourseCard>> =>
    (await api.get<Paginated<CourseCard>>("/courses", { params: cleanParams(params) })).data,

  featured: async (): Promise<CourseCard[]> => (await api.get<CourseCard[]>("/courses/featured")).data,

  get: async (slug: string): Promise<CourseDetail> => (await api.get<CourseDetail>(`/courses/${slug}`)).data,

  create: async (payload: CourseCreatePayload): Promise<CourseDetail> =>
    (await api.post<CourseDetail>("/courses", payload)).data,

  update: async (id: number, payload: CourseUpdatePayload): Promise<CourseDetail> =>
    (await api.patch<CourseDetail>(`/courses/${id}`, payload)).data,

  remove: async (id: number): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },

  uploadCover: async (id: number, file: File, onProgress?: UploadProgress): Promise<CourseDetail> =>
    (await api.post<CourseDetail>(`/courses/${id}/cover`, fileForm(file), multipart(onProgress))).data,

  publish: async (id: number, payload: PublishPayload): Promise<CourseDetail> =>
    (await api.post<CourseDetail>(`/courses/${id}/publish`, payload)).data,

  reviews: async (id: number, params: PaginationParams = {}): Promise<Paginated<Review>> =>
    (await api.get<Paginated<Review>>(`/courses/${id}/reviews`, { params: cleanParams(params) })).data,

  /** Creates the review (201) or updates the caller's existing one (200). */
  review: async (id: number, payload: ReviewPayload): Promise<Review> =>
    (await api.post<Review>(`/courses/${id}/reviews`, payload)).data,

  progress: async (id: number): Promise<CourseProgress> =>
    (await api.get<CourseProgress>(`/courses/${id}/progress`)).data,

  /** Free courses only; the API answers 409 "Bu kurs pullik" for paid ones. */
  enroll: async (id: number): Promise<Enrollment> => (await api.post<Enrollment>(`/courses/${id}/enroll`)).data,
};
