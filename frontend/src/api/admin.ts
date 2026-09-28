import { api, cleanParams } from "./client";
import type {
  AdminCoursesParams,
  AdminPaymentUpdatePayload,
  AdminPaymentsParams,
  AdminStats,
  AdminUserUpdatePayload,
  AdminUsersParams,
  CourseCard,
  Paginated,
  Payment,
  UserPublic,
} from "@/types";

export const adminApi = {
  stats: async (): Promise<AdminStats> => (await api.get<AdminStats>("/admin/stats")).data,

  users: async (params: AdminUsersParams = {}): Promise<Paginated<UserPublic>> =>
    (await api.get<Paginated<UserPublic>>("/admin/users", { params: cleanParams(params) })).data,

  updateUser: async (id: number, payload: AdminUserUpdatePayload): Promise<UserPublic> =>
    (await api.patch<UserPublic>(`/admin/users/${id}`, payload)).data,

  removeUser: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  courses: async (params: AdminCoursesParams = {}): Promise<Paginated<CourseCard>> =>
    (await api.get<Paginated<CourseCard>>("/admin/courses", { params: cleanParams(params) })).data,

  payments: async (params: AdminPaymentsParams = {}): Promise<Paginated<Payment>> =>
    (await api.get<Paginated<Payment>>("/admin/payments", { params: cleanParams(params) })).data,

  updatePayment: async (id: number, payload: AdminPaymentUpdatePayload): Promise<Payment> =>
    (await api.patch<Payment>(`/admin/payments/${id}`, payload)).data,
};
