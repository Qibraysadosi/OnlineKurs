import { api } from "./client";
import type { Enrollment, Payment, PaymentCreatePayload } from "@/types";

export const enrollmentsApi = {
  mine: async (): Promise<Enrollment[]> => (await api.get<Enrollment[]>("/me/enrollments")).data,
};

export const paymentsApi = {
  mine: async (): Promise<Payment[]> => (await api.get<Payment[]>("/me/payments")).data,

  /** 409 if already enrolled, 400 if the course is free (use coursesApi.enroll). */
  create: async (payload: PaymentCreatePayload): Promise<Payment> =>
    (await api.post<Payment>("/payments", payload)).data,

  /** Mock checkout: marks the payment paid and creates the enrollment. Idempotent. */
  confirm: async (id: number): Promise<Payment> => (await api.post<Payment>(`/payments/${id}/confirm`)).data,

  cancel: async (id: number): Promise<Payment> => (await api.post<Payment>(`/payments/${id}/cancel`)).data,
};
