import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  ImageOff,
  MapPin,
  ScanSearch,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { LinkButton } from "../components/ui/LinkButton";
import { Modal } from "../components/ui/Modal";
import { Textarea } from "../components/ui/Form";
import {
  EmptyState,
  ErrorState,
  InlineError,
  LoadingBlock,
} from "../components/ui/States";
import {
  HazardBadge,
  ResolutionBadge,
  SeverityBadge,
  StatusBadge,
} from "../components/reports/Badges";
import { VerificationHistory } from "../components/reports/VerificationHistory";
import { MapView } from "../components/map/MapView";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useAsyncData } from "../hooks/useAsyncData";
import {
  deleteReport,
  getDuplicates,
  getReport,
  rejectReport,
  resolveReport,
  verifyReport,
} from "../services/api";
import {
  formatConfidence,
  formatDate,
  formatDateTime,
  formatDistance,
} from "../utils/format";

type ActionKey = "verify" | "reject" | "resolve";

const actionConfig: Record<
  ActionKey,
  {
    title: string;
    description: string;
    confirmLabel: string;
    success: string;
    variant: "primary" | "danger";
  }
> = {
  verify: {
    title: "Verify this report",
    description:
      "Marking a report verified confirms that the hazard is real and visible on the ground.",
    confirmLabel: "Verify report",
    success: "Report verified",
    variant: "primary",
  },
  reject: {
    title: "Reject this report",
    description:
      "Reject reports that are invalid, duplicated, or cannot be verified. A short reason helps the reporter.",
    confirmLabel: "Reject report",
    success: "Report rejected",
    variant: "danger",
  },
  resolve: {
    title: "Mark this hazard resolved",
    description:
      "Use this when the hazard has been repaired or is no longer present.",
    confirmLabel: "Mark resolved",
    success: "Hazard marked resolved",
    variant: "primary",
  },
};

export function ReportDetails() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const reportQuery = useAsyncData(() => getReport(id), [id]);
  const duplicatesQuery = useAsyncData(() => getDuplicates(id, 500), [id]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [action, setAction] = useState<ActionKey | null>(null);
  const [remarks, setRemarks] = useState("");
  const [actionError, setActionError] = useState("");
  const [acting, setActing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const report = reportQuery.data;

  useEffect(() => {
    if (report) {
      setActiveImage(report.image_urls[0] ?? null);
    }
  }, [report?.id]);

  if (reportQuery.loading) {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="Report details" title="Loading report…" />
        <Card>
          <LoadingBlock label="Loading report details…" />
        </Card>
      </div>
    );
  }

  if (reportQuery.error || !report) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Report details"
          title="Report unavailable"
          actions={
            <LinkButton
              to="/app/reports"
              variant="outline"
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to reports
            </LinkButton>
          }
        />
        <Card>
          <ErrorState
            title="Unable to load this report"
            description={reportQuery.error || "The report could not be found."}
            onRetry={reportQuery.reload}
          />
        </Card>
      </div>
    );
  }

  const duplicates = duplicatesQuery.data ?? [];
  const config = action ? actionConfig[action] : null;

  const openAction = (next: ActionKey) => {
    setAction(next);
    setRemarks("");
    setActionError("");
  };

  const runAction = async () => {
    if (!action) return;
    if (action === "reject" && remarks.trim().length < 5) {
      setActionError("Add a short reason for rejecting this report.");
      return;
    }
    setActing(true);
    setActionError("");
    try {
      const api =
        action === "verify"
          ? verifyReport
          : action === "reject"
            ? rejectReport
            : resolveReport;
      const updated = await api(report.id, remarks.trim() || undefined);
      reportQuery.setData(updated);
      toast.success(actionConfig[action].success);
      setAction(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "The action could not be completed."
      );
    } finally {
      setActing(false);
    }
  };

  const runDelete = async () => {
    setDeleting(true);
    try {
      await deleteReport(report.id);
      toast.success("Report deleted", "The report has been removed permanently.");
      navigate("/app/reports", { replace: true });
    } catch (err) {
      toast.error(
        "Unable to delete report",
        err instanceof Error ? err.message : "Please try again."
      );
      setDeleting(false);
    }
  };

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(report.id);
      toast.success("Reference copied");
    } catch {
      toast.error("Copy failed", "Your browser blocked clipboard access.");
    }
  };

  const openMapUrl = `https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=15/${report.latitude}/${report.longitude}`;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Report details"
        title={report.title}
        description={`Reference ${report.id.slice(0, 8).toUpperCase()} · ${report.district ?? "District not recorded"}`}
        actions={
          <>
            <LinkButton
              to="/app/reports"
              variant="outline"
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to reports
            </LinkButton>
            <LinkButton
              to="/app/map"
              variant="outline"
              icon={<MapPin className="h-4 w-4" />}
            >
              View on map
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            {activeImage ? (
              <>
                <img
                  src={activeImage}
                  alt={`Hazard photograph for ${report.title}`}
                  className="max-h-[440px] w-full bg-charcoal-950 object-contain"
                />
                {report.image_urls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto border-t border-line p-3">
                    {report.image_urls.map((url, index) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setActiveImage(url)}
                        className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 ${
                          activeImage === url
                            ? "border-brand-600"
                            : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                        aria-label={`View photograph ${index + 1}`}
                      >
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center gap-2 bg-surface text-muted">
                <ImageOff className="h-8 w-8" />
                <p className="text-xs">No photographs were attached to this report.</p>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Hazard details"
              description="What was reported, where, and how severe it was assessed."
              action={
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge status={report.status} />
                  <ResolutionBadge status={report.resolution_status} />
                </div>
              }
            />
            <CardBody className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                <HazardBadge type={report.hazard_type} />
                <SeverityBadge severity={report.severity} />
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                {report.description || "No description was provided."}
              </p>
              <dl className="grid gap-3 border-t border-line pt-4 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-muted">District</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {report.district ?? "Not recorded"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Coordinates</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Reported</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {formatDateTime(report.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Last updated</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {formatDateTime(report.updated_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">AI confidence</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {formatConfidence(report.ai_confidence)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Photographs</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {report.image_urls.length}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Location"
              description="The reported hazard position."
              action={
                <a
                  href={openMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
                >
                  Open in OpenStreetMap
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              }
            />
            <MapView
              reports={[report]}
              center={[report.latitude, report.longitude]}
              zoom={14}
              showPopups={false}
              className="h-72 w-full"
            />
          </Card>

          <Card>
            <CardHeader
              title="AI visual analysis"
              description="Model output recorded when the report was submitted."
            />
            <CardBody>
              {report.ai_detections.length === 0 ? (
                <EmptyState
                  icon={<ScanSearch className="h-6 w-6" />}
                  title="No AI detection recorded"
                  description="This report has no stored model output. AI analysis is optional and never replaces human verification."
                />
              ) : (
                <ul className="space-y-3">
                  {report.ai_detections.map((detection) => (
                    <li
                      key={detection.id}
                      className="rounded-lg border border-line bg-surface/50 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-ink">
                          {detection.model_type.replace(/_/g, " ")}
                        </p>
                        <span className="rounded border border-line bg-white px-2 py-0.5 text-[11px] font-medium text-ink">
                          {formatConfidence(detection.confidence)} confidence
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted">
                        Recorded {formatDateTime(detection.created_at)}
                        {detection.bounding_box ? " · bounding box stored" : ""}
                      </p>
                      {detection.mask_url && (
                        <a
                          href={detection.mask_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:text-brand-800"
                        >
                          View segmentation mask
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
                AI confidence is a model signal, not a verification decision or a
                severity rating.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Verification history"
              description="Reviewer decisions and remarks for this report."
            />
            <CardBody>
              <VerificationHistory entries={report.verification_history} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Possible duplicates"
              description="Same-category reports within 500 metres."
              action={
                duplicates.length > 0 ? (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                    {duplicates.length} nearby
                  </span>
                ) : undefined
              }
            />
            <CardBody className="p-0">
              {duplicatesQuery.loading ? (
                <LoadingBlock label="Checking for nearby reports…" />
              ) : duplicatesQuery.error ? (
                <div className="p-4">
                  <InlineError>{duplicatesQuery.error}</InlineError>
                </div>
              ) : duplicates.length === 0 ? (
                <EmptyState
                  icon={<ShieldCheck className="h-6 w-6" />}
                  title="No nearby duplicates"
                  description="No same-category reports were found within 500 metres."
                />
              ) : (
                <ul className="divide-y divide-line">
                  {duplicates.map((candidate) => (
                    <li key={candidate.id}>
                      <Link
                        to={`/app/reports/${candidate.id}`}
                        className="flex items-start justify-between gap-3 px-5 py-3 hover:bg-surface/70"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink">
                            {candidate.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <HazardBadge
                              type={candidate.hazard_type}
                              showIcon={false}
                            />
                            <SeverityBadge severity={candidate.severity} />
                            <StatusBadge status={candidate.status} />
                          </div>
                          <p className="mt-1 text-[11px] text-muted">
                            {formatDate(candidate.created_at)}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-muted">
                          {formatDistance(candidate.distance_m)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-4 self-start xl:sticky xl:top-4">
          <Card>
            <CardHeader title="Review status" />
            <CardBody className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge status={report.status} />
                <ResolutionBadge status={report.resolution_status} />
              </div>
              <p className="text-[11px] leading-relaxed text-muted">
                {isAdmin
                  ? "As an administrator you can verify, reject, or resolve this report. Every action is recorded in the verification history."
                  : "Verification is performed by RoadWatch administrators. Your report will be reviewed before it is marked verified."}
              </p>
              {isAdmin && (
                <div className="space-y-2 border-t border-line pt-3">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => openAction("verify")}
                    disabled={report.status === "verified"}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Verify report
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => openAction("resolve")}
                    disabled={report.resolution_status === "resolved"}
                    icon={<CheckCheck className="h-4 w-4" />}
                  >
                    Mark resolved
                  </Button>
                  <Button
                    className="w-full"
                    variant="danger"
                    onClick={() => openAction("reject")}
                    disabled={report.status === "rejected"}
                    icon={<XCircle className="h-4 w-4" />}
                  >
                    Reject report
                  </Button>
                  <Button
                    className="w-full"
                    variant="ghost"
                    onClick={() => setDeleteOpen(true)}
                    icon={<Trash2 className="h-4 w-4" />}
                  >
                    Delete report
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Report information" />
            <CardBody className="space-y-3 text-xs">
              <div>
                <p className="text-muted">Reference</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <code className="truncate rounded bg-surface px-1.5 py-0.5 text-[11px] text-ink">
                    {report.id}
                  </code>
                  <button
                    type="button"
                    onClick={copyReference}
                    className="rounded p-1 text-muted hover:bg-surface hover:text-ink"
                    aria-label="Copy report reference"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-muted">
                  <UserIcon className="h-3.5 w-3.5" />
                  Reporter
                </span>
                <span className="font-medium text-ink">
                  {report.reporter_id
                    ? report.reporter_id.slice(0, 8)
                    : "Anonymous"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-muted">
                  <Calendar className="h-3.5 w-3.5" />
                  Reported
                </span>
                <span className="font-medium text-ink">
                  {formatDate(report.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-muted">
                  <ScanSearch className="h-3.5 w-3.5" />
                  AI confidence
                </span>
                <span className="font-medium text-ink">
                  {formatConfidence(report.ai_confidence)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  District
                </span>
                <span className="font-medium text-ink">
                  {report.district ?? "—"}
                </span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Report guidance" />
            <CardBody className="space-y-2 text-[11px] leading-relaxed text-muted">
              <p>
                Verify reports only when the hazard is clearly visible and the
                location is plausible.
              </p>
              <p>
                Reject reports that are duplicated, inaccurate, or outside the
                RoadWatch scope, and add a short reason.
              </p>
              <p>
                Resolve a hazard when repair work is complete or the obstruction
                has been cleared.
              </p>
            </CardBody>
          </Card>
        </aside>
      </div>

      <Modal
        open={Boolean(action && config)}
        onClose={() => setAction(null)}
        title={config?.title ?? ""}
        description={config?.description}
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setAction(null)}
              disabled={acting}
            >
              Cancel
            </Button>
            <Button
              variant={config?.variant === "danger" ? "danger" : "primary"}
              onClick={runAction}
              loading={acting}
            >
              {config?.confirmLabel ?? "Confirm"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {actionError && <InlineError>{actionError}</InlineError>}
          <Textarea
            label={action === "reject" ? "Reason for rejection" : "Reviewer remarks (optional)"}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder={
              action === "reject"
                ? "Explain why this report cannot be accepted."
                : "Add context for the reporter or other reviewers."
            }
          />
          <p className="text-[11px] text-muted">
            This action will be recorded in the report's verification history.
          </p>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this report?"
        description="This permanently removes the report and its verification history. This cannot be undone."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={runDelete} loading={deleting}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Report: <span className="font-semibold text-ink">{report.title}</span>
        </p>
      </Modal>
    </div>
  );
}
