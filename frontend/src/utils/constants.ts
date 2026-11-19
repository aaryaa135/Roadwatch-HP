import type {
  HazardType,
  ReportStatus,
  ResolutionStatus,
  Severity,
} from "../types";

export const HP_CENTER: [number, number] = [31.1048, 77.1734];
export const HP_ZOOM = 8;
export const HP_BOUNDS: [[number, number], [number, number]] = [
  [30.35, 75.55],
  [33.25, 79.05],
];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const HAZARD_CATEGORIES: {
  code: HazardType;
  label: string;
  shortLabel: string;
  description: string;
  legacy?: boolean;
}[] = [
  {
    code: "potholes",
    label: "Potholes",
    shortLabel: "Pothole",
    description: "Surface cavities and broken asphalt.",
  },
  {
    code: "longitudinal_cracks",
    label: "Longitudinal cracks",
    shortLabel: "Long. crack",
    description: "Cracks running parallel to the road.",
  },
  {
    code: "transverse_cracks",
    label: "Transverse cracks",
    shortLabel: "Trans. crack",
    description: "Cracks running across the carriageway.",
  },
  {
    code: "alligator_cracks",
    label: "Alligator cracks",
    shortLabel: "Alligator",
    description: "Interconnected fatigue cracking.",
  },
  {
    code: "landslides",
    label: "Landslides",
    shortLabel: "Landslide",
    description: "Slope failure affecting the road.",
  },
  {
    code: "rockfalls",
    label: "Rockfalls",
    shortLabel: "Rockfall",
    description: "Falling rock hazard on hill roads.",
  },
  {
    code: "road_debris",
    label: "Road debris",
    shortLabel: "Debris",
    description: "Debris obstructing the carriageway.",
  },
  {
    code: "waterlogging",
    label: "Waterlogging",
    shortLabel: "Waterlogging",
    description: "Standing water on the road surface.",
  },
  {
    code: "flooding",
    label: "Flooding",
    shortLabel: "Flooding",
    description: "Flooded road sections.",
  },
  {
    code: "other_obstructions",
    label: "Other obstructions",
    shortLabel: "Other",
    description: "Other road obstructions or hazards.",
  },
  {
    code: "road_damage",
    label: "Road damage (legacy)",
    shortLabel: "Road damage",
    description: "Legacy broad road damage category.",
    legacy: true,
  },
  {
    code: "landslide",
    label: "Landslide (legacy)",
    shortLabel: "Landslide",
    description: "Legacy landslide category.",
    legacy: true,
  },
  {
    code: "rockfall_debris",
    label: "Rockfall / debris (legacy)",
    shortLabel: "Rockfall",
    description: "Legacy rockfall and debris category.",
    legacy: true,
  },
  {
    code: "flooding_waterlogging",
    label: "Flooding / waterlogging (legacy)",
    shortLabel: "Flooding",
    description: "Legacy flooding and waterlogging category.",
    legacy: true,
  },
  {
    code: "other",
    label: "Other (legacy)",
    shortLabel: "Other",
    description: "Legacy other hazard category.",
    legacy: true,
  },
];

export const REPORTABLE_HAZARDS = HAZARD_CATEGORIES.filter((item) => !item.legacy);

export const HAZARD_LABELS: Record<string, string> = Object.fromEntries(
  HAZARD_CATEGORIES.map((item) => [item.code, item.label])
);

export const HAZARD_AI_MODEL: Record<string, string | null> = {
  potholes: "road_damage",
  longitudinal_cracks: "road_damage",
  transverse_cracks: "road_damage",
  alligator_cracks: "road_damage",
  landslides: "landslide",
  rockfalls: "rockfall_debris",
  road_debris: "rockfall_debris",
  waterlogging: "flooding_waterlogging",
  flooding: "flooding_waterlogging",
  other_obstructions: null,
  road_damage: "road_damage",
  landslide: "landslide",
  rockfall_debris: "rockfall_debris",
  flooding_waterlogging: "flooding_waterlogging",
  other: null,
};

export const SEVERITIES: {
  code: Severity;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    code: "low",
    label: "Low",
    description: "Minor inconvenience; passable with care.",
    color: "#2f855a",
  },
  {
    code: "medium",
    label: "Medium",
    description: "Noticeable hazard; reduced speed advisable.",
    color: "#d97706",
  },
  {
    code: "high",
    label: "High",
    description: "Serious hazard; may require lane closure.",
    color: "#dc2626",
  },
  {
    code: "critical",
    label: "Critical",
    description: "Immediate danger; road may be impassable.",
    color: "#991b1b",
  },
];

export const SEVERITY_LABELS: Record<string, string> = Object.fromEntries(
  SEVERITIES.map((item) => [item.code, item.label])
);

export const STATUSES: {
  code: ReportStatus;
  label: string;
  description: string;
}[] = [
  {
    code: "pending",
    label: "Pending",
    description: "Awaiting reviewer verification.",
  },
  {
    code: "verified",
    label: "Verified",
    description: "Confirmed by an authorised reviewer.",
  },
  {
    code: "rejected",
    label: "Rejected",
    description: "Not accepted as a valid hazard report.",
  },
  {
    code: "resolved",
    label: "Resolved",
    description: "Hazard has been addressed.",
  },
];

export const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUSES.map((item) => [item.code, item.label])
);

export const RESOLUTION_LABELS: Record<ResolutionStatus, string> = {
  unresolved: "Unresolved",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const DISTRICTS = [
  "Bilaspur",
  "Chamba",
  "Hamirpur",
  "Kangra",
  "Kinnaur",
  "Kullu",
  "Lahaul and Spiti",
  "Mandi",
  "Shimla",
  "Sirmaur",
  "Solan",
  "Una",
];

export const HAZARD_FILTERS = [
  ...REPORTABLE_HAZARDS.map((item) => ({ value: item.code, label: item.label })),
  ...HAZARD_CATEGORIES.filter((item) => item.legacy).map((item) => ({
    value: item.code,
    label: item.label,
  })),
];
