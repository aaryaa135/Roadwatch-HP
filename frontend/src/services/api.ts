import type {
  AnalyticsSummary,
  AuthResponse,
  DuplicateCandidate,
  HazardReport,
  NewReport,
  ReportQuery,
  User,
} from "../types";

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8002";

const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 30_000);
const TOKEN_KEY = "roadwatch.token";

export class ApiError extends Error {
  status: number;
  details: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage can be unavailable in private browsing; the session still works
    // for the current tab because AuthContext keeps the token in memory.
  }
}

type RequestOptions = RequestInit & { timeoutMs?: number };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = API_TIMEOUT_MS, headers, body, ...rest } = options;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  const token = getStoredToken();
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const finalHeaders = new Headers(headers);
  if (!isFormData && body !== undefined && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  finalHeaders.set("Accept", "application/json");

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      body,
      headers: finalHeaders,
      signal: controller.signal,
    });

    if (response.status === 204) return undefined as T;

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    if (!response.ok) {
      const message =
        (payload && typeof payload === "object" && "message" in payload
          ? String((payload as { message?: string }).message)
          : typeof payload === "string" && payload
            ? payload
            : `Request failed with status ${response.status}`);
      const details =
        payload && typeof payload === "object" && "details" in payload
          ? ((payload as { details?: Record<string, unknown> }).details ?? {})
          : {};
      throw new ApiError(message, response.status, details);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The request timed out. Please try again.", 408);
    }
    throw new ApiError(
      "Unable to reach the RoadWatch server. Check your connection and try again.",
      0
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

function queryString<T extends object>(query: T) {
  const params = new URLSearchParams();
  Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const value = params.toString();
  return value ? `?${value}` : "";
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export function getHealth() {
  return request<{ status: string; service: string }>("/health");
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export function registerUser(payload: {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  district?: string;
}) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload: { email: string; password: string }) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCurrentUser() {
  return request<User>("/auth/me");
}

export function updateProfile(payload: {
  full_name?: string;
  phone?: string;
  district?: string;
}) {
  return request<User>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function changePassword(payload: {
  current_password: string;
  new_password: string;
}) {
  return request<void>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export function getReports(params: ReportQuery = {}) {
  return request<HazardReport[]>(`/reports${queryString(params)}`);
}

export function getReport(id: string) {
  return request<HazardReport>(`/reports/${id}`);
}

export function createReport(report: NewReport) {
  return request<HazardReport>("/reports", {
    method: "POST",
    body: JSON.stringify(report),
    timeoutMs: 90_000,
  });
}

export function updateReport(
  id: string,
  patch: Partial<Omit<HazardReport, "id" | "created_at" | "updated_at">>
) {
  return request<HazardReport>(`/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteReport(id: string) {
  return request<void>(`/reports/${id}`, { method: "DELETE" });
}

export function getDuplicates(id: string, radiusM = 300) {
  return request<DuplicateCandidate[]>(
    `/reports/${id}/duplicates${queryString({ radius_m: radiusM })}`
  );
}

export function verifyReport(id: string, remarks?: string) {
  return request<HazardReport>(`/reports/${id}/verify`, {
    method: "POST",
    body: JSON.stringify({ remarks: remarks || null }),
  });
}

export function rejectReport(id: string, remarks?: string) {
  return request<HazardReport>(`/reports/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ remarks: remarks || null }),
  });
}

export function resolveReport(id: string, remarks?: string) {
  return request<HazardReport>(`/reports/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({ remarks: remarks || null }),
  });
}

// ---------------------------------------------------------------------------
// Map / analytics
// ---------------------------------------------------------------------------

export function getMapReports(params: ReportQuery = {}) {
  return request<HazardReport[]>(`/hazards/map${queryString(params)}`);
}

export function getNearbyReports(params: {
  lat: number;
  lng: number;
  radius_m?: number;
  limit?: number;
}) {
  return request<(HazardReport & { distance_m: number })[]>(
    `/hazards/nearby${queryString(params)}`
  );
}

export function getAnalyticsSummary() {
  return request<AnalyticsSummary>("/analytics/summary");
}

// ---------------------------------------------------------------------------
// Uploads and AI
// ---------------------------------------------------------------------------

export function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request<{ url: string; filename: string }>("/uploads", {
    method: "POST",
    body: formData,
    timeoutMs: 60_000,
  });
}

export function aiHealth() {
  return request<{ ai_service_ok: boolean }>("/ai/health");
}

export function aiInfer(model_type: string, image_url: string) {
  return request<{
    model_type: string;
    confidence: number;
    predictions: unknown[];
    message: string;
    model_loaded: boolean;
    bounding_box?: Record<string, number> | null;
    mask_url?: string | null;
  }>("/ai/infer", {
    method: "POST",
    body: JSON.stringify({ model_type, image_url }),
    timeoutMs: 90_000,
  });
}

// ---------------------------------------------------------------------------
// Geocoding (OpenStreetMap Nominatim)
// ---------------------------------------------------------------------------

export interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("viewbox", "75.55,33.25,79.05,30.35");
  url.searchParams.set("bounded", "1");
  url.searchParams.set("addressdetails", "0");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Location search is unavailable right now.");
  return response.json();
}
