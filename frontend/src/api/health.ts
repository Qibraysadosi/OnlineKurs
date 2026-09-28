import { api } from "./client";
import type { HealthStatus } from "@/types";

export const healthApi = {
  check: async (): Promise<HealthStatus> => (await api.get<HealthStatus>("/health")).data,
};
