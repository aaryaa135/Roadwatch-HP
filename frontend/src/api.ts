/// <reference types="vite/client" />

import type {
  HazardReport,
  NewReport,
  ReportStatus,
  Severity,
  AIInferenceResult,
} from "./types";

export type {
  HazardReport,
  NewReport,
  ReportStatus,
  Severity,
  AIInferenceResult,
};

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `Request failed: ${response.status}`);
  }
  return response;
}

export async function getReports(params?: {
  hazard_type?: string;
  status?: string;
  severity?: string;
  district?: string;
  limit?: number;
  offset?: number;
}): Promise<HazardReport[]> {
  const search = new URLSearchParams();
  if (params?.hazard_type) search.set("hazard_type", params.hazard_type);
  if (params?.status) search.set("status", params.status);
  if (params?.severity) search.set("severity", params.severity);
  if (params?.district) search.set("district", params.district);
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  if (params?.offset !== undefined) search.set("offset", String(params.offset));
  const response = await request(`/reports?${search.toString()}`);
  return response.json();
}

export async function getReport(id: string): Promise<HazardReport> {
  const response = await request(`/reports/${id}`);
  return response.json();
}

export async function createReport(report: NewReport): Promise<HazardReport> {
  const response = await request("/reports", {
    method: "POST",
    body: JSON.stringify(report),
  });
  return response.json();
}

export async function updateReport(
  id: string,
  patch: Partial<Omit<HazardReport, "id" | "created_at" | "updated_at">>
): Promise<HazardReport> {
  const response = await request(`/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return response.json();
}

export async function deleteReport(id: string): Promise<void> {
  await request(`/reports/${id}`, { method: "DELETE" });
}

export async function uploadImage(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/uploads`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `Upload failed: ${response.status}`);
  }
  return response.json();
}

export async function aiHealth(): Promise<{ ai_service_ok: boolean }> {
  const response = await request("/ai/health");
  return response.json();
}

export async function aiInfer(
  model_type: string,
  image_url: string
): Promise<AIInferenceResult> {
  const response = await request("/ai/infer", {
    method: "POST",
    body: JSON.stringify({ model_type, image_url }),
  });
  return response.json();
}
