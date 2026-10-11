import { apiClient } from "@/lib/api-client";
import type { ApiResponse, AuthUser } from "@/types/api";

export async function getMyProfile() {
  const res = await apiClient.get<ApiResponse<AuthUser>>("/users/me");
  return res.data;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
}

export async function updateMyProfile(payload: UpdateProfilePayload) {
  const res = await apiClient.patch<ApiResponse<AuthUser>>("/users/me", payload);
  return res.data;
}
