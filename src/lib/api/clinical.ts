import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  Consultation,
  LabTestRequest,
  LabTestStatus,
  Prescription,
  PrescriptionItem,
} from "@/types/api";

// Consultations
export async function createConsultation(payload: { appointmentId: string; chiefComplaint?: string }) {
  const res = await apiClient.post<ApiResponse<Consultation>>("/consultations", payload);
  return res.data;
}

export async function getConsultation(id: string) {
  const res = await apiClient.get<ApiResponse<Consultation>>(`/consultations/${id}`);
  return res.data;
}

export interface UpdateConsultationPayload {
  symptoms?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  treatmentPlan?: string;
  followUpDate?: string;
  status?: string;
}

export async function updateConsultation(id: string, payload: UpdateConsultationPayload) {
  const res = await apiClient.patch<ApiResponse<Consultation>>(`/consultations/${id}`, payload);
  return res.data;
}

// Prescriptions
export interface CreatePrescriptionPayload {
  consultationId: string;
  notes?: string;
  items: PrescriptionItem[];
}

export async function createPrescription(payload: CreatePrescriptionPayload) {
  const res = await apiClient.post<ApiResponse<Prescription>>("/prescriptions", payload);
  return res.data;
}

export async function listPrescriptions(params: { page?: number; limit?: number }) {
  const res = await apiClient.get<ApiResponse<Prescription[]>>("/prescriptions", { params });
  return res.data;
}

export async function getPrescription(id: string) {
  const res = await apiClient.get<ApiResponse<Prescription>>(`/prescriptions/${id}`);
  return res.data;
}

// Lab tests
export async function createLabTestRequest(payload: {
  consultationId: string;
  labTestId: string;
  notes?: string;
}) {
  const res = await apiClient.post<ApiResponse<LabTestRequest>>("/lab-test-requests", payload);
  return res.data;
}

export async function listLabTestRequests(params: { status?: LabTestStatus }) {
  const res = await apiClient.get<ApiResponse<LabTestRequest[]>>("/lab-test-requests", { params });
  return res.data;
}

export async function updateLabTestResult(
  id: string,
  payload: { status: LabTestStatus; resultSummary?: string; resultFileUrl?: string }
) {
  const res = await apiClient.patch<ApiResponse<LabTestRequest>>(
    `/lab-test-requests/${id}/result`,
    payload
  );
  return res.data;
}
