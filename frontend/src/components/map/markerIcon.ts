import L from "leaflet";
import type { HazardReport } from "../../types";
import { HAZARD_LABELS } from "../../utils/constants";

const abbreviations: Record<string, string> = {
  potholes: "P",
  road_damage: "P",
  longitudinal_cracks: "LC",
  transverse_cracks: "TC",
  alligator_cracks: "AC",
  landslides: "LS",
  landslide: "LS",
  rockfalls: "RF",
  rockfall_debris: "RF",
  road_debris: "D",
  waterlogging: "W",
  flooding_waterlogging: "F",
  flooding: "F",
  other_obstructions: "O",
  other: "O",
};

export function createHazardIcon(report: HazardReport, selected = false) {
  const severity = ["low", "medium", "high", "critical"].includes(report.severity)
    ? report.severity
    : "medium";
  const label = HAZARD_LABELS[report.hazard_type] ?? "Hazard";
  const abbreviation = abbreviations[report.hazard_type] ?? "!";
  const size = severity === "critical" ? 32 : 28;
  const html = `<div class="rw-marker rw-marker--${severity} ${
    selected ? "rw-marker--selected" : ""
  }" title="${label}" aria-label="${label}, ${severity} severity">${abbreviation}</div>`;
  return L.divIcon({
    html,
    className: "bg-transparent border-0",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function createPinIcon() {
  return L.divIcon({
    html: '<div class="rw-pin"><span class="rw-pin__dot"></span></div>',
    className: "bg-transparent border-0",
    iconSize: [30, 40],
    iconAnchor: [15, 38],
  });
}

export function createClusterIcon(cluster: { getChildCount: () => number }) {
  const count = cluster.getChildCount();
  const size = count >= 100 ? 46 : count >= 10 ? 40 : 34;
  return L.divIcon({
    html: `<div class="rw-cluster-icon" style="width:${size}px;height:${size}px">${count}</div>`,
    className: "bg-transparent border-0",
    iconSize: L.point(size, size),
  });
}
