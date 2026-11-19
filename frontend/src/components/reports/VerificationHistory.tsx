import {
  CheckCircle2,
  Clock3,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { VerificationEntry } from "../../types";
import { formatDateTime } from "../../utils/format";
import { EmptyState } from "../ui/States";

const actionMeta: Record<
  string,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  verified: {
    label: "Verified",
    icon: ShieldCheck,
    className: "bg-emerald-50 text-emerald-700",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-red-50 text-red-700",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    className: "bg-sky-50 text-sky-700",
  },
  submitted: {
    label: "Submitted",
    icon: Clock3,
    className: "bg-surface text-muted",
  },
};

export function VerificationHistory({
  entries,
}: {
  entries: VerificationEntry[];
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<Clock3 className="h-6 w-6" />}
        title="No review activity yet"
        description="Verification decisions and reviewer remarks will appear here."
      />
    );
  }

  return (
    <ol className="space-y-4">
      {entries.map((entry, index) => {
        const meta = actionMeta[entry.action] ?? actionMeta.submitted;
        const Icon = meta.icon;
        return (
          <li key={entry.id} className="relative flex gap-3">
            {index < entries.length - 1 && (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-line"
                aria-hidden="true"
              />
            )}
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.className}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-ink">{meta.label}</p>
                <p className="text-[11px] text-muted">
                  {formatDateTime(entry.created_at)}
                </p>
              </div>
              <p className="mt-0.5 text-[11px] text-muted">
                {entry.reviewer_name ?? "RoadWatch reviewer"}
              </p>
              {entry.remarks && (
                <p className="mt-1.5 rounded-md bg-surface px-2.5 py-1.5 text-xs leading-relaxed text-ink">
                  {entry.remarks}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
