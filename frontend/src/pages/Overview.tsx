import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Map as MapIcon,
  MapPin,
  Plus,
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
import { EmptyState, ErrorState, Skeleton } from "../components/ui/States";
import { ReportTable } from "../components/reports/ReportTable";
import { MapPreview } from "../components/map/MapView";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { getAnalyticsSummary, getReports } from "../services/api";
import type { HazardReport } from "../types";
import {
  HAZARD_LABELS,
  SEVERITIES,
  SEVERITY_LABELS,
} from "../utils/constants";
import { formatDate, severityRank } from "../utils/format";

const chartTooltipStyle = {
  borderRadius: 8,
  border: "1px solid #e1e4e1",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(20, 28, 23, 0.08)",
};

function monthLabel(value: string) {
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date);
}

export function Overview() {
  const { user } = useAuth();
  const summaryQuery = useAsyncData(getAnalyticsSummary, []);
  const reportsQuery = useAsyncData(
    () => getReports({ limit: 100, sort_by: "created_at", sort_dir: "desc" }),
    []
  );

  const summary = summaryQuery.data;
  const reports = reportsQuery.data ?? [];
  const firstName = user?.full_name.split(" ")[0] ?? "there";

  const recentReports = reports.slice(0, 6);
  const highPriority = [...reports]
    .filter(
      (report) =>
        report.status !== "rejected" &&
        (report.severity === "high" || report.severity === "critical")
    )
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 5);

  const hazardData = (summary?.by_hazard_type ?? [])
    .map((item) => ({
      name: HAZARD_LABELS[item.code] ?? item.code,
      value: item.count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const severityData = SEVERITIES.map((severity) => ({
    code: severity.code,
    name: severity.label,
    value:
      summary?.by_severity.find((item) => item.code === severity.code)?.count ??
      0,
    color: severity.color,
  })).filter((item) => item.value > 0);

  const monthlyData = (summary?.monthly ?? []).map((item) => ({
    month: monthLabel(item.month),
    reports: item.count,
  }));

  const districtData = [...(summary?.by_district ?? [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const districtMax = Math.max(1, ...districtData.map((item) => item.count));

  const hasSummary = Boolean(summary);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Command overview"
        title={`Welcome back, ${firstName}`}
        description="A live view of road-hazard reports, verification activity, and priority locations across Himachal Pradesh."
        actions={
          <>
            <LinkButton
              to="/app/report"
              icon={<Plus className="h-4 w-4" />}
            >
              Report a hazard
            </LinkButton>
            <LinkButton
              to="/app/map"
              variant="outline"
              icon={<MapIcon className="h-4 w-4" />}
            >
              Open map
            </LinkButton>
          </>
        }
      />

      {summaryQuery.error && (
        <Card>
          <ErrorState
            title="Unable to load the dashboard summary"
            description={summaryQuery.error}
            onRetry={summaryQuery.reload}
          />
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total reports"
          value={summary?.total_reports ?? 0}
          description="All hazard reports on record"
          icon={ClipboardList}
          tone="brand"
          loading={summaryQuery.loading}
        />
        <StatCard
          label="Verified hazards"
          value={summary?.verified ?? 0}
          description="Confirmed by reviewers"
          icon={ShieldCheck}
          tone="sky"
          loading={summaryQuery.loading}
        />
        <StatCard
          label="Pending verification"
          value={summary?.pending ?? 0}
          description="Awaiting a review decision"
          icon={Clock3}
          tone="amber"
          loading={summaryQuery.loading}
        />
        <StatCard
          label="High severity"
          value={summary?.high_severity ?? 0}
          description="High and critical hazards"
          icon={AlertTriangle}
          tone="red"
          loading={summaryQuery.loading}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Reports over time"
            description="Monthly report volume across the state."
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">
                <TrendingUp className="h-3.5 w-3.5" />
                Monthly
              </span>
            }
          />
          <CardBody>
            {summaryQuery.loading ? (
              <Skeleton className="h-60 w-full" />
            ) : monthlyData.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-6 w-6" />}
                title="No reporting history yet"
                description="Monthly trends will appear once reports are submitted."
              />
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ left: -18, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="reportsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#356a4d" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#356a4d" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e1e4e1" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#5f6a63" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#5f6a63" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="reports"
                      stroke="#356a4d"
                      strokeWidth={2.5}
                      fill="url(#reportsFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Severity mix"
            description="Distribution of reported severity."
          />
          <CardBody>
            {summaryQuery.loading ? (
              <Skeleton className="h-60 w-full" />
            ) : severityData.length === 0 ? (
              <EmptyState
                icon={<AlertTriangle className="h-6 w-6" />}
                title="No severity data"
                description="Severity distribution will appear here."
              />
            ) : (
              <div className="flex flex-col items-center gap-3 sm:flex-row xl:flex-col">
                <div className="h-40 w-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={46}
                        outerRadius={70}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {severityData.map((entry) => (
                          <Cell key={entry.code} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
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
            description="Most frequently reported hazard types."
          />
          <CardBody>
            {summaryQuery.loading ? (
              <Skeleton className="h-56 w-full" />
            ) : hazardData.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-6 w-6" />}
                title="No category data"
                description="Category breakdown will appear once reports exist."
              />
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hazardData}
                    layout="vertical"
                    margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e1e4e1" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#5f6a63" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={112}
                      tick={{ fontSize: 11, fill: "#5f6a63" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="value" fill="#356a4d" radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Top districts"
            description="Reports by district."
            action={
              <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                <MapPin className="h-3.5 w-3.5" />
                HP
              </span>
            }
          />
          <CardBody>
            {summaryQuery.loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
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
              <ul className="space-y-3">
                {districtData.map((item) => (
                  <li key={item.district}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-ink">{item.district}</span>
                      <span className="font-semibold text-muted">{item.count}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-line/70">
                      <div
                        className="h-full rounded-full bg-brand-600"
                        style={{ width: `${(item.count / districtMax) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Recent reports"
            description="Latest submissions from citizens and field staff."
            action={
              <Link
                to="/app/reports"
                className="text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                View all
              </Link>
            }
          />
          <ReportTable
            reports={recentReports}
            loading={reportsQuery.loading}
            error={reportsQuery.error}
            onRetry={reportsQuery.reload}
            emptyTitle="No reports yet"
            emptyDescription="Submit the first hazard report to populate this dashboard."
          />
        </Card>

        <Card>
          <CardHeader
            title="Priority hazards"
            description="High and critical reports needing attention."
          />
          <CardBody className="p-0">
            {reportsQuery.loading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : highPriority.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-6 w-6" />}
                title="No high-severity reports"
                description="There are no unresolved high or critical hazards in the latest reports."
              />
            ) : (
              <ul className="divide-y divide-line">
                {highPriority.map((report: HazardReport) => (
                  <li key={report.id}>
                    <Link
                      to={`/app/reports/${report.id}`}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface/70"
                    >
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          report.severity === "critical"
                            ? "bg-severity-critical"
                            : "bg-severity-high"
                        }`}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-ink">
                          {report.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted">
                          {SEVERITY_LABELS[report.severity] ?? report.severity} ·{" "}
                          {report.district ?? "Unknown district"} ·{" "}
                          {formatDate(report.created_at)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Latest reports map"
          description="Geographic spread of the most recent submissions."
          action={
            <Link
              to="/app/map"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              Open full map
            </Link>
          }
        />
        <div className="relative overflow-hidden rounded-b-card">
          {reportsQuery.loading || !hasSummary ? (
            <Skeleton className="h-64 w-full rounded-none" />
          ) : reports.length === 0 ? (
            <EmptyState
              icon={<MapIcon className="h-6 w-6" />}
              title="No mapped reports"
              description="Reports with coordinates will appear on this map."
            />
          ) : (
            <MapPreview reports={reports} className="h-64 w-full" />
          )}
        </div>
      </Card>
    </div>
  );
}
