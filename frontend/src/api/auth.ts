import { api, fileForm, multipart } from "./client";
import type {
  ChangePasswordPayload,
  LoginPayload,
  RefreshPayload,
  RegisterPayload,
  Tokens,
  UpdateMePayload,
  UploadProgress,
  UserPublic,
} from "@/types";

export const authApi = {
  register: async (payload: RegisterPayload): Promise<Tokens> => (await api.post<Tokens>("/auth/register", payload)).data,

  login: async (payload: LoginPayload): Promise<Tokens> => (await api.post<Tokens>("/auth/login", payload)).data,

  refresh: async (payload: RefreshPayload): Promise<Tokens> => (await api.post<Tokens>("/auth/refresh", payload)).data,

  me: async (): Promise<UserPublic> => (await api.get<UserPublic>("/auth/me")).data,

  updateMe: async (payload: UpdateMePayload): Promise<UserPublic> =>
    (await api.patch<UserPublic>("/auth/me", payload)).data,

  uploadAvatar: async (file: File, onProgress?: UploadProgress): Promise<UserPublic> =>
    (await api.post<UserPublic>("/auth/me/avatar", fileForm(file), multipart(onProgress))).data,

  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await api.post("/auth/me/password", payload);
  },
};
