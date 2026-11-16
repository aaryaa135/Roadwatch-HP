export function HazardTypeIcon({ type }: { type: string }) {
  const labels: Record<string, string> = {
    road_damage: "Road damage",
    landslide: "Landslide",
    rockfall_debris: "Rockfall / debris",
    flooding_waterlogging: "Flooding / waterlogging",
    other: "Other",
  };
  return <span>{labels[type] || type}</span>;
}

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className="gov-badge">{severity.charAt(0).toUpperCase() + severity.slice(1)}</span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className="gov-badge">{status.replace(/_/g, " ").toUpperCase()}</span>;
}
