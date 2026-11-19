import type { LucideIcon } from "lucide-react";
import { cn } from "../../utils/format";

const tones = {
  brand:
    "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm",
  red: "bg-gradient-to-br from-red-500 to-severity-high text-white shadow-sm",
  amber:
    "bg-gradient-to-br from-amber-400 to-severity-medium text-white shadow-sm",
  slate: "bg-gradient-to-br from-charcoal-600 to-charcoal-800 text-white shadow-sm",
  sky: "bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-sm",
};

const accents = {
  brand: "border-l-brand-500",
  red: "border-l-severity-high",
  amber: "border-l-severity-medium",
  slate: "border-l-charcoal-700",
  sky: "border-l-sky-500",
};

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "brand",
  loading = false,
}: {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  loading?: boolean;
}) {
  return (
    <div className={cn("rw-card rw-card-hover border-l-4 p-5", accents[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{label}</p>
          {loading ? (
            <div className="rw-skeleton mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1.5 text-3xl font-bold tracking-tight text-ink">
              {value}
            </p>
          )}
          {description && (
            <p className="mt-1 truncate text-[11px] text-muted">{description}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            tones[tone]
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
