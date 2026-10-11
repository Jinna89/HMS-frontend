"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  ClipboardList,
  FlaskConical,
  Loader2,
  Pill,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getAppointment, updateAppointmentStatus } from "@/lib/api/appointments";
import {
  createConsultation,
  updateConsultation,
  createPrescription,
  createLabTestRequest,
} from "@/lib/api/clinical";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn, formatDateTime, initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PrescriptionItem } from "@/types/api";

// The backend has no "get consultation by appointment" lookup, only
// POST /consultations and GET /consultations/:id. Once a consultation is
// created for this appointment, its id is cached locally so the workflow
// is resumable across reloads without inventing a server endpoint.
function consultationKey(appointmentId: string) {
  return `hms:consultation:${appointmentId}`;
}

const STEPS = [
  { key: "complaint", label: "Chief complaint" },
  { key: "clinical", label: "Diagnosis & notes" },
  { key: "prescription", label: "Prescription" },
  { key: "labs", label: "Lab tests" },
] as const;

export default function ConsultationWorkflowPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [consultationId, setConsultationId] = useState<string | null>(null);

  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");

  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [items, setItems] = useState<PrescriptionItem[]>([
    { medicineId: "", dosage: "", frequency: "", duration: "", instructions: "" },
  ]);
  const [prescriptionCreated, setPrescriptionCreated] = useState(false);

  const [labTestId, setLabTestId] = useState("");
  const [labNotes, setLabNotes] = useState("");
  const [labRequested, setLabRequested] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["doctor", "appointment", params.id],
    queryFn: () => getAppointment(params.id),
  });

  useEffect(() => {
    const cached = typeof window !== "undefined" ? localStorage.getItem(consultationKey(params.id)) : null;
    if (cached) {
      setConsultationId(cached);
      setStep(1);
    }
  }, [params.id]);

  const appointment = data?.success ? data.data : null;

  const startConsultation = useMutation({
    mutationFn: () => createConsultation({ appointmentId: params.id, chiefComplaint }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message || "Could not start the consultation");
        return;
      }
      setConsultationId(res.data.id);
      if (typeof window !== "undefined") localStorage.setItem(consultationKey(params.id), res.data.id);
      toast.success("Consultation started");
      setStep(1);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const saveClinical = useMutation({
    mutationFn: () =>
      updateConsultation(consultationId as string, {
        symptoms,
        diagnosis,
        clinicalNotes,
        treatmentPlan,
      }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message || "Could not save clinical notes");
        return;
      }
      toast.success("Diagnosis & notes saved");
      setStep(2);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const savePrescription = useMutation({
    mutationFn: () =>
      createPrescription({
        consultationId: consultationId as string,
        notes: prescriptionNotes || undefined,
        items: items.filter((item) => item.medicineId && item.dosage),
      }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message || "Could not save the prescription");
        return;
      }
      toast.success("Prescription saved");
      setPrescriptionCreated(true);
      setStep(3);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const requestLabTest = useMutation({
    mutationFn: () =>
      createLabTestRequest({
        consultationId: consultationId as string,
        labTestId,
        notes: labNotes || undefined,
      }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message || "Could not request this lab test");
        return;
      }
      toast.success("Lab test requested");
      setLabRequested(true);
      setLabTestId("");
      setLabNotes("");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const completeConsultation = useMutation({
    mutationFn: () => updateAppointmentStatus(params.id, "COMPLETED"),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message || "Could not complete this appointment");
        return;
      }
      toast.success("Consultation completed");
      router.push("/doctor");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const updateItem = (index: number, patch: Partial<PrescriptionItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const canAddMoreItems = useMemo(() => items.length < 10, [items.length]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="Appointment not found"
        description="This appointment may have been removed or isn't assigned to you."
        action={
          <Button asChild size="sm">
            <Link href="/doctor">Back to my tasks</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback>{initials(appointment.patient?.name ?? "P")}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{appointment.patient?.name ?? "Patient"}</p>
              <p className="text-sm text-muted-foreground">{formatDateTime(appointment.appointmentDate)}</p>
            </div>
          </div>
          <StatusBadge status={appointment.status} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((s, idx) => (
          <div
            key={s.key}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
              idx === step
                ? "border-primary bg-primary text-primary-foreground"
                : idx < step || (idx === 0 && consultationId)
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-border text-muted-foreground"
            )}
          >
            {idx + 1}. {s.label}
          </div>
        ))}
      </div>

      {step === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Chief complaint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <Textarea
              rows={3}
              placeholder="What is the patient presenting with today?"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
            />
            <Button
              disabled={!chiefComplaint || startConsultation.isPending}
              onClick={() => startConsultation.mutate()}
            >
              {startConsultation.isPending ? <Loader2 className="animate-spin" /> : <Check />}
              Start consultation
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Diagnosis & clinical notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Symptoms</label>
              <Textarea rows={2} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Diagnosis</label>
              <Textarea rows={2} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Clinical notes</label>
              <Textarea rows={3} value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Treatment plan</label>
              <Textarea rows={2} value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} />
            </div>
            <Button disabled={saveClinical.isPending} onClick={() => saveClinical.mutate()}>
              {saveClinical.isPending ? <Loader2 className="animate-spin" /> : <Check />}
              Save & continue
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Prescription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {prescriptionCreated ? (
              <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
                Prescription saved for this consultation.
              </p>
            ) : (
              <>
                {items.map((item, idx) => (
                  <div key={idx} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
                    <Input
                      placeholder="Medicine name"
                      value={item.medicineId}
                      onChange={(e) => updateItem(idx, { medicineId: e.target.value })}
                    />
                    <Input
                      placeholder="Dosage (e.g. 500mg)"
                      value={item.dosage}
                      onChange={(e) => updateItem(idx, { dosage: e.target.value })}
                    />
                    <Input
                      placeholder="Frequency (e.g. twice daily)"
                      value={item.frequency}
                      onChange={(e) => updateItem(idx, { frequency: e.target.value })}
                    />
                    <Input
                      placeholder="Duration (e.g. 5 days)"
                      value={item.duration}
                      onChange={(e) => updateItem(idx, { duration: e.target.value })}
                    />
                    <Input
                      className="sm:col-span-2"
                      placeholder="Instructions (optional)"
                      value={item.instructions}
                      onChange={(e) => updateItem(idx, { instructions: e.target.value })}
                    />
                    {items.length > 1 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="sm:col-span-2 w-fit text-destructive hover:text-destructive"
                        onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="size-3.5" /> Remove medicine
                      </Button>
                    ) : null}
                  </div>
                ))}
                {canAddMoreItems ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setItems((prev) => [
                        ...prev,
                        { medicineId: "", dosage: "", frequency: "", duration: "", instructions: "" },
                      ])
                    }
                  >
                    <Pill className="size-3.5" /> Add another medicine
                  </Button>
                ) : null}
                <Textarea
                  rows={2}
                  placeholder="General notes for the pharmacist or patient (optional)"
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                />
                <Button
                  disabled={savePrescription.isPending || !items.some((i) => i.medicineId && i.dosage)}
                  onClick={() => savePrescription.mutate()}
                >
                  {savePrescription.isPending ? <Loader2 className="animate-spin" /> : <Check />}
                  Save prescription & continue
                </Button>
              </>
            )}
            {prescriptionCreated ? (
              <Button variant="outline" onClick={() => setStep(3)}>
                Continue to lab tests
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. Request lab tests (optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Lab test name"
                value={labTestId}
                onChange={(e) => setLabTestId(e.target.value)}
              />
              <Input
                placeholder="Notes for the lab (optional)"
                value={labNotes}
                onChange={(e) => setLabNotes(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              disabled={!labTestId || requestLabTest.isPending}
              onClick={() => requestLabTest.mutate()}
            >
              {requestLabTest.isPending ? <Loader2 className="animate-spin" /> : <FlaskConical />}
              Request lab test
            </Button>
            {labRequested ? (
              <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
                Lab test requested. You can request more, or finish the consultation below.
              </p>
            ) : null}

            <div className="border-t border-border pt-4">
              <Button
                disabled={completeConsultation.isPending}
                onClick={() => completeConsultation.mutate()}
              >
                {completeConsultation.isPending ? <Loader2 className="animate-spin" /> : <ClipboardList />}
                Finish & mark appointment completed
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
