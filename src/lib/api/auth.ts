import { apiClient } from "@/lib/api-client";
import type { ApiResponse, AuthUser, LoginResponseData } from "@/types/api";

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerPatient(payload: RegisterPayload) {
  const res = await apiClient.post<ApiResponse<LoginResponseData | AuthUser>>(
    "/auth/register",
    payload
  );
  return res.data;
}

export async function login(payload: LoginPayload) {
  const res = await apiClient.post<ApiResponse<LoginResponseData>>("/auth/login", payload);
  return res.data;
}

export async function logout(refreshToken: string) {
  const res = await apiClient.post<ApiResponse<null>>("/auth/logout", { refreshToken });
  return res.data;
}

export async function fetchMe() {
  const res = await apiClient.get<ApiResponse<AuthUser>>("/auth/me");
  return res.data;
}
