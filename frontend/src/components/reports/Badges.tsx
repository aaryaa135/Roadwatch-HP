import {
  AlertTriangle,
  Boxes,
  Construction,
  Droplets,
  Grid3X3,
  Mountain,
  MountainSnow,
  MoveHorizontal,
  MoveVertical,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type {
  HazardType,
  ReportStatus,
  ResolutionStatus,
  Severity,
} from "../../types";
import {
  HAZARD_LABELS,
  RESOLUTION_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from "../../utils/constants";
import { cn } from "../../utils/format";

const hazardIcons: Record<string, LucideIcon> = {
  potholes: Construction,
  road_damage: Construction,
  longitudinal_cracks: MoveHorizontal,
  transverse_cracks: MoveVertical,
  alligator_cracks: Grid3X3,
  landslides: Mountain,
  landslide: Mountain,
  rockfalls: MountainSnow,
  rockfall_debris: MountainSnow,
  road_debris: Boxes,
  waterlogging: Droplets,
  flooding_waterlogging: Droplets,
  flooding: Waves,
  other_obstructions: AlertTriangle,
  other: AlertTriangle,
};

export function HazardIcon({
  type,
  className,
}: {
  type: HazardType | string;
  className?: string;
}) {
  const Icon = hazardIcons[type] ?? AlertTriangle;
  return <Icon className={cn("h-4 w-4", className)} aria-hidden="true" />;
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

export function HazardBadge({
  type,
  showIcon = true,
  className,
}: {
  type: HazardType | string;
  showIcon?: boolean;
  className?: string;
}) {
  return (
    <Badge className={cn("border-line bg-surface text-ink", className)}>
      {showIcon && <HazardIcon type={type} className="h-3.5 w-3.5 text-muted" />}
      {HAZARD_LABELS[type] ?? type.replace(/_/g, " ")}
    </Badge>
  );
}

const severityStyles: Record<string, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-red-200 bg-red-50 text-red-700",
  critical: "border-red-300 bg-red-100 text-red-900",
};

const severityDots: Record<string, string> = {
  low: "bg-severity-low",
  medium: "bg-severity-medium",
  high: "bg-severity-high",
  critical: "bg-severity-critical",
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity | string;
  className?: string;
}) {
  return (
    <Badge className={cn(severityStyles[severity], className)}>
      <span
        className={cn("h-1.5 w-1.5 rounded-full", severityDots[severity])}
        aria-hidden="true"
      />
      {SEVERITY_LABELS[severity] ?? severity}
    </Badge>
  );
}

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  verified: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-700",
  resolved: "border-sky-200 bg-sky-50 text-sky-800",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ReportStatus | string;
  className?: string;
}) {
  return (
    <Badge className={cn(statusStyles[status], className)}>
      {STATUS_LABELS[status] ?? status.replace(/_/g, " ")}
    </Badge>
  );
}

export function ResolutionBadge({
  status,
  className,
}: {
  status: ResolutionStatus | string;
  className?: string;
}) {
  const styles: Record<string, string> = {
    unresolved: "border-line bg-surface text-muted",
    in_progress: "border-sky-200 bg-sky-50 text-sky-800",
    resolved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  return (
    <Badge className={cn(styles[status] ?? styles.unresolved, className)}>
      {RESOLUTION_LABELS[status as ResolutionStatus] ?? status}
    </Badge>
  );
}
