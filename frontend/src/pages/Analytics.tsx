import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  MapPin,
  ScanSearch,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "../components/layout/PageHeader";
import { StatCard } from "../components/dashboard/StatCard";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { LinkButton } from "../components/ui/LinkButton";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/States";
import { useToast } from "../context/ToastContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { getAnalyticsSummary, getReports } from "../services/api";
import {
  HAZARD_LABELS,
  SEVERITIES,
  STATUS_LABELS,
} from "../utils/constants";
import { formatConfidence } from "../utils/format";

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

const statusColors: Record<string, string> = {
  pending: "#d97706",
  verified: "#15803d",
  rejected: "#dc2626",
  resolved: "#0284c7",
};

function monthLabel(value: string) {
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}

export function Analytics() {
  const toast = useToast();
  const summaryQuery = useAsyncData(getAnalyticsSummary, []);
  const reportsQuery = useAsyncData(() => getReports({ limit: 500 }), []);

  const summary = summaryQuery.data;
  const reports = reportsQuery.data ?? [];

  const categoryData = (summary?.by_hazard_type ?? [])
    .map((item) => ({
      name: HAZARD_LABELS[item.code] ?? item.code,
      value: item.count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const severityData = SEVERITIES.map((severity) => ({
    code: severity.code,
    name: severity.label,
    value:
      summary?.by_severity.find((item) => item.code === severity.code)?.count ??
      0,
    color: severity.color,
  })).filter((item) => item.value > 0);

  const statusData = (summary?.by_status ?? [])
    .map((item) => ({
      code: item.code,
      name: STATUS_LABELS[item.code] ?? item.code,
      value: item.count,
      color: statusColors[item.code] ?? "#94a3b8",
    }))
    .filter((item) => item.value > 0);

  const monthlyData = (summary?.monthly ?? []).map((item) => ({
    month: monthLabel(item.month),
    reports: item.count,
  }));

  const districtData = [...(summary?.by_district ?? [])].sort(
    (a, b) => b.count - a.count
  );
  const districtMax = Math.max(1, ...districtData.map((item) => item.count));
  const total = summary?.total_reports ?? 0;

  const aiInsight = useMemo(() => {
    const normalize = (value: number) => (value <= 1 ? value : value / 100);
    const withConfidence = reports.filter(
      (report) => report.ai_confidence !== null
    );
    const average =
      withConfidence.length === 0
        ? null
        : withConfidence.reduce(
            (sum, report) => sum + normalize(report.ai_confidence ?? 0),
            0
          ) / withConfidence.length;
    const highConfidence = withConfidence.filter(
      (report) => normalize(report.ai_confidence ?? 0) >= 0.75
    ).length;
    return {
      coverage:
        reports.length === 0
          ? 0
          : Math.round((withConfidence.length / reports.length) * 100),
      average,
      highConfidence,
      sample: reports.length,
    };
  }, [reports]);

  const verificationRate =
    total === 0 ? 0 : Math.round(((summary?.verified ?? 0) / total) * 100);
  const highSeverityRate =
    total === 0 ? 0 : Math.round(((summary?.high_severity ?? 0) / total) * 100);

  const exportCsv = () => {
    if (reports.length === 0) {
      toast.error("Nothing to export", "No reports are available yet.");
      return;
    }
    const csv = toCsv(
      reports.map((report) => ({
        id: report.id,
        title: report.title,
        hazard_type: report.hazard_type,
        severity: report.severity,
        status: report.status,
        resolution_status: report.resolution_status,
        district: report.district ?? "",
        latitude: report.latitude,
        longitude: report.longitude,
        ai_confidence: report.ai_confidence ?? "",
        created_at: report.created_at,
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `roadwatch-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Export ready", "The latest reports were downloaded as CSV.");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Understand reporting volume, hazard mix, verification progress, and district-level distribution across Himachal Pradesh."
        actions={
          <>
            <Button
              variant="outline"
              onClick={exportCsv}
              icon={<Download className="h-4 w-4" />}
            >
              Export CSV
            </Button>
            <LinkButton to="/app/map" icon={<MapPin className="h-4 w-4" />}>
              Open map
            </LinkButton>
          </>
        }
      />

      {summaryQuery.error && (
        <Card>
          <ErrorState
            title="Unable to load analytics"
            description={summaryQuery.error}
            onRetry={summaryQuery.reload}
          />
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total reports"
          value={total}
          description="All-time hazard reports"
          icon={Activity}
          tone="brand"
          loading={summaryQuery.loading}
        />
        <StatCard
          label="Verification rate"
          value={`${verificationRate}%`}
          description={`${summary?.verified ?? 0} verified reports`}
          icon={ShieldCheck}
          tone="sky"
          loading={summaryQuery.loading}
        />
        <StatCard
          label="High severity share"
          value={`${highSeverityRate}%`}
          description={`${summary?.high_severity ?? 0} high or critical`}
          icon={AlertTriangle}
          tone="red"
          loading={summaryQuery.loading}
        />
        <StatCard
          label="Resolved hazards"
          value={summary?.resolved ?? 0}
          description="Marked resolved by reviewers"
          icon={CheckCircle2}
          tone="amber"
          loading={summaryQuery.loading}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Reporting trend"
            description="Monthly report volume across all recorded hazards."
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">
                <TrendingUp className="h-3.5 w-3.5" />
                Monthly
              </span>
            }
          />
          <CardBody>
            {summaryQuery.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : monthlyData.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-6 w-6" />}
                title="No trend data"
                description="Monthly report volume will appear once reports are recorded."
              />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ left: -18, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#15803d" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#15803d" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="reports"
                      stroke="#15803d"
                      strokeWidth={2.5}
                      fill="url(#analyticsFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Severity distribution"
            description="How reported hazards split by severity."
          />
          <CardBody>
            {summaryQuery.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : severityData.length === 0 ? (
              <EmptyState
                icon={<AlertTriangle className="h-6 w-6" />}
                title="No severity data"
                description="Severity distribution will appear here."
              />
            ) : (
              <div className="flex flex-col items-center gap-3 sm:flex-row xl:flex-col">
                <div className="h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={78}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {severityData.map((entry) => (
                          <Cell key={entry.code} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="w-full space-y-2">
                  {severityData.map((entry) => (
                    <li
                      key={entry.code}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="flex items-center gap-2 text-muted">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        {entry.name}
                      </span>
                      <span className="font-semibold text-ink">{entry.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Hazard categories"
            description="The most frequently reported hazard types."
          />
          <CardBody>
            {summaryQuery.loading ? (
              <Skeleton className="h-72 w-full" />
            ) : categoryData.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-6 w-6" />}
                title="No category data"
                description="Category distribution will appear once reports exist."
              />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    layout="vertical"
                    margin={{ left: 8, right: 20, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 11, fill: "#475569" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="#15803d" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Verification status"
            description="Current status of all reports."
          />
          <CardBody>
            {summaryQuery.loading ? (
              <Skeleton className="h-56 w-full" />
            ) : statusData.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck className="h-6 w-6" />}
                title="No status data"
                description="Status distribution will appear here."
              />
            ) : (
              <ul className="space-y-4">
                {statusData.map((entry) => {
                  const share = total === 0 ? 0 : (entry.value / total) * 100;
                  return (
                    <li key={entry.code}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="flex items-center gap-2 text-muted">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          {entry.name}
                        </span>
                        <span className="font-semibold text-ink">
                          {entry.value}{" "}
                          <span className="font-normal text-muted">
                            ({Math.round(share)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${share}%`,
                            backgroundColor: entry.color,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="District distribution"
            description="Reports recorded in each Himachal Pradesh district."
          />
          {summaryQuery.loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          ) : districtData.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title="No district data"
              description="District totals will appear once reports are recorded."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="rw-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Reports</th>
                    <th className="w-1/2">Share of total</th>
                  </tr>
                </thead>
                <tbody>
                  {districtData.map((item) => {
                    const share = total === 0 ? 0 : (item.count / total) * 100;
                    return (
                      <tr key={item.district}>
                        <td className="font-medium text-ink">{item.district}</td>
                        <td className="text-muted">{item.count}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                              <div
                                className="h-full rounded-full bg-brand-600"
                                style={{
                                  width: `${(item.count / districtMax) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="w-10 text-right text-[11px] text-muted">
                              {Math.round(share)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="AI coverage"
            description="Model output on the latest reports."
            action={
              <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                <ScanSearch className="h-3.5 w-3.5" />
                Sample {aiInsight.sample}
              </span>
            }
          />
          <CardBody>
            {reportsQuery.loading ? (
              <Skeleton className="h-40 w-full" />
            ) : aiInsight.sample === 0 ? (
              <EmptyState
                icon={<ScanSearch className="h-6 w-6" />}
                title="No reports to analyse"
                description="AI coverage will appear once reports are submitted."
              />
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Reports with AI output</span>
                    <span className="font-semibold text-ink">
                      {aiInsight.coverage}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{ width: `${aiInsight.coverage}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-line bg-surface/50 p-3">
                    <p className="text-[11px] text-muted">Average confidence</p>
                    <p className="mt-1 text-lg font-bold text-ink">
                      {aiInsight.average === null
                        ? "—"
                        : formatConfidence(aiInsight.average)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-line bg-surface/50 p-3">
                    <p className="text-[11px] text-muted">High confidence</p>
                    <p className="mt-1 text-lg font-bold text-ink">
                      {aiInsight.highConfidence}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-muted">
                  Based on up to 500 recent reports. AI confidence is a model
                  signal and does not verify a hazard or set its severity.
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
