import { api } from "./client";
import type { Category, CategoryCreatePayload, CategoryUpdatePayload } from "@/types";

export const categoriesApi = {
  list: async (): Promise<Category[]> => (await api.get<Category[]>("/categories")).data,

  create: async (payload: CategoryCreatePayload): Promise<Category> =>
    (await api.post<Category>("/categories", payload)).data,

  update: async (id: number, payload: CategoryUpdatePayload): Promise<Category> =>
    (await api.patch<Category>(`/categories/${id}`, payload)).data,

  remove: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
