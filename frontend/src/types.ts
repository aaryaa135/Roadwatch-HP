export type HazardType =
  | "potholes"
  | "longitudinal_cracks"
  | "transverse_cracks"
  | "alligator_cracks"
  | "landslides"
  | "rockfalls"
  | "road_debris"
  | "waterlogging"
  | "flooding"
  | "other_obstructions"
  | "road_damage"
  | "landslide"
  | "rockfall_debris"
  | "flooding_waterlogging"
  | "other";

export type Severity = "low" | "medium" | "high" | "critical";

export type ReportStatus = "pending" | "verified" | "rejected" | "resolved";

export type ResolutionStatus = "unresolved" | "in_progress" | "resolved";

export type UserRole = "citizen" | "admin";

export interface AIDetection {
  id: string;
  model_type: string;
  confidence: number;
  bounding_box: BoundingBox | null;
  mask_url: string | null;
  created_at: string;
}

export interface BoundingBox {
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
  [key: string]: number | undefined;
}

export interface VerificationEntry {
  id: string;
  action: string;
  remarks: string | null;
  reviewer_name: string | null;
  created_at: string;
}

export interface HazardReport {
  id: string;
  reporter_id: string | null;
  title: string;
  description: string | null;
  hazard_type: HazardType;
  severity: Severity;
  district: string | null;
  latitude: number;
  longitude: number;
  status: ReportStatus;
  resolution_status: ResolutionStatus;
  image_urls: string[];
  ai_confidence: number | null;
  ai_detections: AIDetection[];
  verification_history: VerificationEntry[];
  created_at: string;
  updated_at: string;
}

export interface NewReport {
  title: string;
  description: string;
  hazard_type: HazardType;
  severity: Severity;
  district: string;
  latitude: number;
  longitude: number;
  image_urls?: string[];
}

export interface AIInferenceResult {
  model_type: string;
  confidence: number;
  predictions: unknown[];
  message: string;
  model_loaded: boolean;
  bounding_box?: BoundingBox | null;
  mask_url?: string | null;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  district: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DuplicateCandidate {
  id: string;
  title: string;
  hazard_type: HazardType;
  severity: Severity;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  created_at: string;
  distance_m: number;
}

export interface AnalyticsSummary {
  total_reports: number;
  verified: number;
  pending: number;
  rejected: number;
  resolved: number;
  high_severity: number;
  by_hazard_type: { code: string; count: number }[];
  by_severity: { code: string; count: number }[];
  by_status: { code: string; count: number }[];
  by_district: { district: string; count: number }[];
  monthly: { month: string; count: number }[];
}

export interface ReportQuery {
  hazard_type?: string;
  status?: string;
  severity?: string;
  district?: string;
  reporter_id?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  bbox?: string;
  limit?: number;
  offset?: number;
}
