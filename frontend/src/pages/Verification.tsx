import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCheck,
  CheckCircle2,
  Clock3,
  Filter,
  Inbox,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Textarea, Select } from "../components/ui/Form";
import { SearchInput } from "../components/ui/SearchInput";
import { Pagination } from "../components/ui/Pagination";
import {
  EmptyState,
  ErrorState,
  InlineError,
  Skeleton,
} from "../components/ui/States";
import {
  HazardBadge,
  SeverityBadge,
  StatusBadge,
} from "../components/reports/Badges";
import { useToast } from "../context/ToastContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { useDebounce } from "../hooks/useDebounce";
import {
  getAnalyticsSummary,
  getReports,
  rejectReport,
  resolveReport,
  verifyReport,
} from "../services/api";
import type { HazardReport } from "../types";
import {
  DISTRICTS,
  SEVERITIES,
} from "../utils/constants";
import {
  formatConfidence,
  formatDate,
  relativeTime,
} from "../utils/format";

type ActionKey = "verify" | "reject" | "resolve";
type TabKey = "pending" | "verified" | "rejected" | "resolved" | "all";

const tabs: { key: TabKey; label: string; icon: typeof Clock3 }[] = [
  { key: "pending", label: "Pending", icon: Clock3 },
  { key: "verified", label: "Verified", icon: ShieldCheck },
  { key: "rejected", label: "Rejected", icon: XCircle },
  { key: "resolved", label: "Resolved", icon: CheckCheck },
  { key: "all", label: "All", icon: Inbox },
];

const actionCopy: Record<
  ActionKey,
  { title: string; description: string; confirm: string; success: string; danger?: boolean }
> = {
  verify: {
    title: "Verify report",
    description: "Confirm that this hazard is real and visible on the ground.",
    confirm: "Verify report",
    success: "Report verified",
  },
  reject: {
    title: "Reject report",
    description: "Reject invalid, duplicated, or unverifiable reports.",
    confirm: "Reject report",
    success: "Report rejected",
    danger: true,
  },
  resolve: {
    title: "Mark resolved",
    description: "Use this when the hazard has been repaired or cleared.",
    confirm: "Mark resolved",
    success: "Hazard marked resolved",
  },
};

const PAGE_SIZE = 10;

export function Verification() {
  const toast = useToast();
  const [tab, setTab] = useState<TabKey>("pending");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [severity, setSeverity] = useState("");
  const [district, setDistrict] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<{ report: HazardReport; action: ActionKey } | null>(
    null
  );
  const [remarks, setRemarks] = useState("");
  const [actionError, setActionError] = useState("");
  const [acting, setActing] = useState(false);

  const summaryQuery = useAsyncData(getAnalyticsSummary, []);
  const query = useAsyncData(
    () =>
      getReports({
        status: tab === "all" ? undefined : tab,
        search: debouncedSearch.trim() || undefined,
        severity: severity || undefined,
        district: district || undefined,
        sort_by: "created_at",
        sort_dir: tab === "pending" ? "asc" : "desc",
        limit: 500,
      }),
    [tab, debouncedSearch, severity, district]
  );

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, severity, district]);

  const reports = query.data ?? [];
  const pageCount = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageReports = useMemo(
    () => reports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [reports, currentPage]
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    (summaryQuery.data?.by_status ?? []).forEach((item) => {
      map[item.code] = item.count;
    });
    return map;
  }, [summaryQuery.data]);

  const tabCount = (key: TabKey) => {
    if (key === "all") return summaryQuery.data?.total_reports ?? 0;
    return counts[key] ?? 0;
  };

  const openAction = (report: HazardReport, action: ActionKey) => {
    setTarget({ report, action });
    setRemarks("");
    setActionError("");
  };

  const runAction = async () => {
    if (!target) return;
    if (target.action === "reject" && remarks.trim().length < 5) {
      setActionError("Add a short reason for rejecting this report.");
      return;
    }
    setActing(true);
    setActionError("");
    try {
      const api =
        target.action === "verify"
          ? verifyReport
          : target.action === "reject"
            ? rejectReport
            : resolveReport;
      await api(target.report.id, remarks.trim() || undefined);
      toast.success(actionCopy[target.action].success);
      setTarget(null);
      query.reload();
      summaryQuery.reload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "The action could not be completed."
      );
    } finally {
      setActing(false);
    }
  };

  const copy = target ? actionCopy[target.action] : null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Verification queue"
        description="Review citizen reports, confirm genuine hazards, and record resolution decisions. Every action is audited."
        actions={
          <Link
            to="/app/reports"
            className="text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            Open report register
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pending review", value: counts.pending ?? 0, tone: "amber", icon: Clock3 },
          { label: "Verified", value: counts.verified ?? 0, tone: "emerald", icon: ShieldCheck },
          { label: "Rejected", value: counts.rejected ?? 0, tone: "red", icon: XCircle },
          { label: "Resolved", value: counts.resolved ?? 0, tone: "sky", icon: CheckCheck },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-muted">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-ink">{item.value}</p>
              </div>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  item.tone === "amber"
                    ? "bg-amber-50 text-amber-700"
                    : item.tone === "emerald"
                      ? "bg-emerald-50 text-emerald-700"
                      : item.tone === "red"
                        ? "bg-red-50 text-red-700"
                        : "bg-sky-50 text-sky-700"
                }`}
              >
                <item.icon className="h-4 w-4" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap gap-1 border-b border-line px-3 pt-3">
          {tabs.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`inline-flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "border-brand-700 text-brand-700"
                    : "border-transparent text-muted hover:text-ink"
                }`}
                aria-pressed={active}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
                <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted">
                  {tabCount(item.key)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search pending reports"
              label="Search verification queue"
            />
          </div>
          <Select
            label="Severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
          >
            <option value="">All severities</option>
            {SEVERITIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </Select>
          <Select
            label="District"
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
          >
            <option value="">All districts</option>
            {DISTRICTS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title={`${tabs.find((item) => item.key === tab)?.label} reports`}
          description={`${reports.length} report${reports.length === 1 ? "" : "s"} in this view.`}
          action={
            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
              <Filter className="h-3.5 w-3.5" />
              Page {currentPage} of {pageCount}
            </span>
          }
        />

        {query.loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        ) : query.error ? (
          <ErrorState
            title="Unable to load the verification queue"
            description={query.error}
            onRetry={query.reload}
          />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-6 w-6" />}
            title={
              tab === "pending"
                ? "The pending queue is clear"
                : "No reports in this view"
            }
            description={
              tab === "pending"
                ? "There are no reports waiting for verification right now."
                : "Try another status tab, or clear the search and filters."
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {pageReports.map((report) => (
              <li key={report.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row">
                  {report.image_urls[0] ? (
                    <img
                      src={report.image_urls[0]}
                      alt=""
                      className="h-24 w-full rounded-lg border border-line object-cover sm:w-32"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center rounded-lg border border-line bg-surface text-[11px] text-muted sm:w-32">
                      No photo
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/app/reports/${report.id}`}
                          className="text-sm font-semibold text-ink hover:text-brand-700"
                        >
                          {report.title}
                        </Link>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {report.district ?? "District not recorded"} ·{" "}
                          {formatDate(report.created_at)} ·{" "}
                          {relativeTime(report.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <HazardBadge type={report.hazard_type} />
                      <SeverityBadge severity={report.severity} />
                      <span className="rounded border border-line bg-white px-2 py-0.5 text-[11px] font-medium text-muted">
                        AI {formatConfidence(report.ai_confidence)}
                      </span>
                    </div>
                    {report.description && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
                        {report.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAction(report, "verify")}
                        disabled={report.status === "verified"}
                        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      >
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAction(report, "resolve")}
                        disabled={report.resolution_status === "resolved"}
                        icon={<CheckCheck className="h-3.5 w-3.5" />}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => openAction(report, "reject")}
                        disabled={report.status === "rejected"}
                        icon={<XCircle className="h-3.5 w-3.5" />}
                      >
                        Reject
                      </Button>
                      <Link
                        to={`/app/reports/${report.id}`}
                        className="inline-flex h-8 items-center rounded-md px-2 text-xs font-medium text-brand-700 hover:bg-surface"
                      >
                        Open report
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!query.loading && !query.error && reports.length > PAGE_SIZE && (
          <Pagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={reports.length}
            onPageChange={setPage}
          />
        )}
      </Card>

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={copy?.title ?? ""}
        description={copy?.description}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={acting}>
              Cancel
            </Button>
            <Button
              variant={copy?.danger ? "danger" : "primary"}
              onClick={runAction}
              loading={acting}
            >
              {copy?.confirm ?? "Confirm"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {actionError && <InlineError>{actionError}</InlineError>}
          {target && (
            <div className="rounded-lg border border-line bg-surface/60 p-3">
              <p className="text-xs font-semibold text-ink">{target.report.title}</p>
              <p className="mt-0.5 text-[11px] text-muted">
                {target.report.district ?? "District not recorded"} ·{" "}
                {target.report.latitude.toFixed(5)},{" "}
                {target.report.longitude.toFixed(5)}
              </p>
            </div>
          )}
          <Textarea
            label={
              target?.action === "reject"
                ? "Reason for rejection"
                : "Reviewer remarks (optional)"
            }
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder={
              target?.action === "reject"
                ? "Explain why this report cannot be accepted."
                : "Add context for the reporter or other reviewers."
            }
          />
          <p className="text-[11px] text-muted">
            This decision will be recorded in the report's verification history.
          </p>
        </div>
      </Modal>
    </div>
  );
}
