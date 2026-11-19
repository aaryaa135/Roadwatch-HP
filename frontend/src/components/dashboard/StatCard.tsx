import type { LucideIcon } from "lucide-react";
import { cn } from "../../utils/format";

const tones = {
  brand: "bg-brand-50 text-brand-700",
  red: "bg-red-50 text-severity-high",
  amber: "bg-amber-50 text-severity-medium",
  slate: "bg-surface text-muted",
  sky: "bg-sky-50 text-sky-700",
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
    <div className="rw-card p-5">
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
