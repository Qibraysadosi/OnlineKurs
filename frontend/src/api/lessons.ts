import { api, fileForm, multipart } from "./client";
import type {
  LessonCompleteResult,
  LessonCreatePayload,
  LessonOrderPayload,
  LessonOut,
  LessonUpdatePayload,
  UploadProgress,
} from "@/types";

export const lessonsApi = {
  create: async (sectionId: number, payload: LessonCreatePayload): Promise<LessonOut> =>
    (await api.post<LessonOut>(`/sections/${sectionId}/lessons`, payload)).data,

  /** 403 "Bu darsni ko'rish uchun kursni sotib oling" when locked. */
  get: async (id: number): Promise<LessonOut> => (await api.get<LessonOut>(`/lessons/${id}`)).data,

  update: async (id: number, payload: LessonUpdatePayload): Promise<LessonOut> =>
    (await api.patch<LessonOut>(`/lessons/${id}`, payload)).data,

  remove: async (id: number): Promise<void> => {
    await api.delete(`/lessons/${id}`);
  },

  reorder: async (sectionId: number, payload: LessonOrderPayload): Promise<LessonOut[]> =>
    (await api.put<LessonOut[]>(`/sections/${sectionId}/lessons/order`, payload)).data,

  uploadVideo: async (id: number, file: File, onProgress?: UploadProgress): Promise<LessonOut> =>
    (await api.post<LessonOut>(`/lessons/${id}/video`, fileForm(file), multipart(onProgress))).data,

  uploadAttachment: async (id: number, file: File, onProgress?: UploadProgress): Promise<LessonOut> =>
    (await api.post<LessonOut>(`/lessons/${id}/attachment`, fileForm(file), multipart(onProgress))).data,

  complete: async (id: number): Promise<LessonCompleteResult> =>
    (await api.post<LessonCompleteResult>(`/lessons/${id}/complete`)).data,

  uncomplete: async (id: number): Promise<LessonCompleteResult> =>
    (await api.delete<LessonCompleteResult>(`/lessons/${id}/complete`)).data,
};
