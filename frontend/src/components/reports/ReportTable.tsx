import { Link } from "react-router-dom";
import { ArrowUpRight, FileText } from "lucide-react";
import type { HazardReport } from "../../types";
import { formatDate, relativeTime } from "../../utils/format";
import {
  HazardBadge,
  SeverityBadge,
  StatusBadge,
} from "./Badges";
import { EmptyState, ErrorState, SkeletonTable } from "../ui/States";

export function ReportTable({
  reports,
  loading,
  error,
  onRetry,
  emptyTitle = "No reports found",
  emptyDescription = "Try changing the filters or search terms.",
  compact = false,
}: {
  reports: HazardReport[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  compact?: boolean;
}) {
  if (loading) return <SkeletonTable rows={compact ? 4 : 6} />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;
  if (reports.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="rw-table">
        <thead>
          <tr>
            <th>Report</th>
            <th>Category</th>
            <th>Severity</th>
            <th>Status</th>
            {!compact && <th>District</th>}
            <th>Reported</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td className="max-w-[280px]">
                <Link
                  to={`/app/reports/${report.id}`}
                  className="block truncate font-medium text-ink hover:text-brand-700"
                >
                  {report.title}
                </Link>
                <span className="text-[11px] text-muted">
                  {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                </span>
              </td>
              <td>
                <HazardBadge type={report.hazard_type} />
              </td>
              <td>
                <SeverityBadge severity={report.severity} />
              </td>
              <td>
                <StatusBadge status={report.status} />
              </td>
              {!compact && (
                <td className="whitespace-nowrap text-muted">
                  {report.district ?? "—"}
                </td>
              )}
              <td className="whitespace-nowrap">
                <span className="block text-ink">{formatDate(report.created_at)}</span>
                <span className="text-[11px] text-muted">
                  {relativeTime(report.created_at)}
                </span>
              </td>
              <td className="text-right">
                <Link
                  to={`/app/reports/${report.id}`}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-surface"
                >
                  View
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
