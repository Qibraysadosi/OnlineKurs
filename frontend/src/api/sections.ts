import { api } from "./client";
import type { SectionCreatePayload, SectionOrderPayload, SectionOut, SectionUpdatePayload } from "@/types";

export const sectionsApi = {
  create: async (courseId: number, payload: SectionCreatePayload): Promise<SectionOut> =>
    (await api.post<SectionOut>(`/courses/${courseId}/sections`, payload)).data,

  update: async (id: number, payload: SectionUpdatePayload): Promise<SectionOut> =>
    (await api.patch<SectionOut>(`/sections/${id}`, payload)).data,

  remove: async (id: number): Promise<void> => {
    await api.delete(`/sections/${id}`);
  },

  reorder: async (courseId: number, payload: SectionOrderPayload): Promise<SectionOut[]> =>
    (await api.put<SectionOut[]>(`/courses/${courseId}/sections/order`, payload)).data,
};
