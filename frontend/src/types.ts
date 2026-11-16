export type HazardType =
  | "road_damage"
  | "landslide"
  | "rockfall_debris"
  | "flooding_waterlogging"
  | "other";

export type Severity = "low" | "medium" | "high" | "critical";

export type ReportStatus = "pending" | "verified" | "rejected" | "resolved";

export interface HazardReport {
  id: string;
  reporter_id?: string | null;
  title: string;
  description: string | null;
  hazard_type: HazardType;
  severity: Severity;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  district: string | null;
  image_urls: string[];
  ai_confidence: number | null;
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
}

export interface AIInferenceResult {
  model_type: string;
  confidence: number;
  predictions: unknown[];
  message: string;
  model_loaded: boolean;
}
