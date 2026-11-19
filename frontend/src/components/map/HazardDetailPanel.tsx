import { Link } from "react-router-dom";
import { ArrowUpRight, Calendar, MapPin, ScanSearch, X } from "lucide-react";
import type { HazardReport } from "../../types";
import {
  formatConfidence,
  formatDate,
  formatDateTime,
} from "../../utils/format";
import {
  HazardBadge,
  ResolutionBadge,
  SeverityBadge,
  StatusBadge,
} from "../reports/Badges";

export function HazardDetailPanel({
  report,
  onClose,
}: {
  report: HazardReport;
  onClose: () => void;
}) {
  const image = report.image_urls[0];
  return (
    <aside className="rw-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Selected hazard
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-ink">{report.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted hover:bg-surface hover:text-ink"
          aria-label="Close hazard details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {image ? (
        <img
          src={image}
          alt={`Hazard report: ${report.title}`}
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-28 items-center justify-center bg-surface text-xs text-muted">
          No photograph attached
        </div>
      )}
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          <HazardBadge type={report.hazard_type} />
          <SeverityBadge severity={report.severity} />
          <StatusBadge status={report.status} />
          <ResolutionBadge status={report.resolution_status} />
        </div>
        <dl className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <ScanSearch className="h-3.5 w-3.5" />
              AI confidence
            </dt>
            <dd className="font-semibold text-ink">
              {formatConfidence(report.ai_confidence)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <MapPin className="mt-0.5 h-3.5 w-3.5" />
              Location
            </dt>
            <dd className="text-right font-medium text-ink">
              {report.district ?? "District not recorded"}
              <br />
              <span className="text-[11px] text-muted">
                {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <Calendar className="h-3.5 w-3.5" />
              Reported
            </dt>
            <dd className="font-medium text-ink">{formatDate(report.created_at)}</dd>
          </div>
        </dl>
        <p className="border-t border-line pt-3 text-[11px] text-muted">
          Last updated {formatDateTime(report.updated_at)}
        </p>
        <Link
          to={`/app/reports/${report.id}`}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
        >
          Open full report
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
