import { apiClient } from "@/lib/api-client";
import type { ApiResponse, AvailableSlot, Doctor, DoctorLeave, DoctorSchedule } from "@/types/api";

export interface DoctorListParams {
  page?: number;
  limit?: number;
  specialty?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function listDoctors(params: DoctorListParams) {
  const res = await apiClient.get<ApiResponse<Doctor[]>>("/doctors", { params });
  return res.data;
}

export async function searchDoctors(q: string) {
  const res = await apiClient.get<ApiResponse<Doctor[]>>("/doctors/search", { params: { q } });
  return res.data;
}

export async function getDoctor(id: string) {
  const res = await apiClient.get<ApiResponse<Doctor>>(`/doctors/${id}`);
  return res.data;
}

export async function getMyDoctorProfile() {
  const res = await apiClient.get<ApiResponse<Doctor>>("/doctors/me");
  return res.data;
}

export async function updateMyDoctorProfile(payload: Partial<Doctor>) {
  const res = await apiClient.patch<ApiResponse<Doctor>>("/doctors/me", payload);
  return res.data;
}

export async function getAvailableSlots(id: string, date: string) {
  const res = await apiClient.get<ApiResponse<AvailableSlot[]>>(`/doctors/${id}/available-slots`, {
    params: { date },
  });
  return res.data;
}

export interface CreateSchedulePayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  consultationDurationMins: number;
}

export async function createMySchedule(payload: CreateSchedulePayload) {
  const res = await apiClient.post<ApiResponse<DoctorSchedule>>("/doctors/me/schedules", payload);
  return res.data;
}

export async function updateMySchedule(id: string, payload: Partial<CreateSchedulePayload>) {
  const res = await apiClient.patch<ApiResponse<DoctorSchedule>>(
    `/doctors/me/schedules/${id}`,
    payload
  );
  return res.data;
}

export interface CreateLeavePayload {
  startDate: string;
  endDate: string;
  reason?: string;
}

export async function createMyLeave(payload: CreateLeavePayload) {
  const res = await apiClient.post<ApiResponse<DoctorLeave>>("/doctors/me/leaves", payload);
  return res.data;
}
