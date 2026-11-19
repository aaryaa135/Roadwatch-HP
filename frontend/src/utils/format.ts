export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function relativeTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = date.getTime() - Date.now();
  if (Number.isNaN(diff)) return "—";
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / 60_000);
  if (minutes < 1) return "just now";
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (minutes < 60) return formatter.format(Math.sign(diff) * minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return formatter.format(Math.sign(diff) * hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 30) return formatter.format(Math.sign(diff) * days, "day");
  const months = Math.round(days / 30);
  if (months < 12) return formatter.format(Math.sign(diff) * months, "month");
  return formatter.format(Math.sign(diff) * Math.round(months / 12), "year");
}

export function formatConfidence(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}%`;
}

export function formatCoord(value: number) {
  return value.toFixed(5);
}

export function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function severityRank(severity: string) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity] ?? 0;
}

export function bboxFromBounds(bounds: {
  getSouth: () => number;
  getWest: () => number;
  getNorth: () => number;
  getEast: () => number;
}) {
  return [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ]
    .map((value) => value.toFixed(6))
    .join(",");
}
