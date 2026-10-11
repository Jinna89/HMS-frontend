import { apiClient } from "@/lib/api-client";
import type { ApiResponse, Payment } from "@/types/api";

export async function initiatePayment(appointmentId: string) {
  const res = await apiClient.post<ApiResponse<{ gatewayUrl: string; tranId: string }>>(
    "/payments/initiate",
    { appointmentId }
  );
  return res.data;
}

export async function getPayment(id: string) {
  const res = await apiClient.get<ApiResponse<Payment>>(`/payments/${id}`);
  return res.data;
}
