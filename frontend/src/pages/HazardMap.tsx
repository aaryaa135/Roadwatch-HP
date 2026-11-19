import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Crosshair,
  Filter,
  List,
  MapPin,
  Plus,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { MapView } from "../components/map/MapView";
import { MapFilters } from "../components/map/MapFilters";
import type { MapFilterState } from "../components/map/MapFilters";
import { MapLegend } from "../components/map/MapLegend";
import { HazardDetailPanel } from "../components/map/HazardDetailPanel";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { LinkButton } from "../components/ui/LinkButton";
import { SearchInput } from "../components/ui/SearchInput";
import { EmptyState, Skeleton } from "../components/ui/States";
import {
  HazardBadge,
  SeverityBadge,
  StatusBadge,
} from "../components/reports/Badges";
import { useAsyncData } from "../hooks/useAsyncData";
import { useDebounce } from "../hooks/useDebounce";
import { getMapReports } from "../services/api";
import type { HazardReport } from "../types";
import {
  HAZARD_LABELS,
  HP_CENTER,
  HP_ZOOM,
} from "../utils/constants";
import { formatDate, relativeTime } from "../utils/format";

const EMPTY_FILTERS: MapFilterState = {
  hazard_type: "",
  severity: "",
  status: "",
};

export function HazardMap() {
  const [filters, setFilters] = useState<MapFilterState>(EMPTY_FILTERS);
  const [bbox, setBbox] = useState("");
  const debouncedBbox = useDebounce(bbox, 450);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<HazardReport | null>(null);
  const [center, setCenter] = useState<[number, number]>(HP_CENTER);
  const [zoom, setZoom] = useState(HP_ZOOM);

  const query = useAsyncData(
    () =>
      getMapReports({
        bbox: debouncedBbox || undefined,
        hazard_type: filters.hazard_type || undefined,
        severity: filters.severity || undefined,
        status: filters.status || undefined,
        limit: 500,
      }),
    [debouncedBbox, filters.hazard_type, filters.severity, filters.status]
  );

  const reports = query.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return reports;
    return reports.filter((report) => {
      const haystack = [
        report.title,
        report.description ?? "",
        report.district ?? "",
        HAZARD_LABELS[report.hazard_type] ?? report.hazard_type,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [reports, search]);

  useEffect(() => {
    if (selected && !reports.some((report) => report.id === selected.id)) {
      setSelected(null);
    }
  }, [reports, selected]);

  const selectReport = (report: HazardReport) => {
    setSelected(report);
    setCenter([report.latitude, report.longitude]);
    setZoom((current) => (current < 12 ? 13 : current));
  };

  const resetView = () => {
    setSelected(null);
    setFilters(EMPTY_FILTERS);
    setSearch("");
    setBbox("");
    setCenter(HP_CENTER);
    setZoom(HP_ZOOM);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Live hazard map"
        title="Hazard map"
        description="Explore verified and pending road hazards across Himachal Pradesh. Pan or zoom to load reports for the current viewport."
        actions={
          <>
            <Button
              variant="outline"
              onClick={resetView}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Reset view
            </Button>
            <LinkButton to="/app/report" icon={<Plus className="h-4 w-4" />}>
              Report hazard
            </LinkButton>
          </>
        }
      />

      <MapFilters
        value={filters}
        onChange={setFilters}
        onReset={() => setFilters(EMPTY_FILTERS)}
        resultCount={filtered.length}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <CardHeader
            title="Himachal Pradesh"
            description={
              query.loading
                ? "Loading reports in the current viewport…"
                : `${filtered.length} report${filtered.length === 1 ? "" : "s"} in view`
            }
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCenter([...HP_CENTER]);
                  setZoom(HP_ZOOM);
                }}
                icon={<Crosshair className="h-3.5 w-3.5" />}
              >
                State centre
              </Button>
            }
          />
          <div className="relative">
            <MapView
              reports={filtered}
              center={center}
              zoom={zoom}
              selectedId={selected?.id ?? null}
              onSelect={selectReport}
              onViewportChange={(nextBbox) => setBbox(nextBbox)}
              className="h-[calc(100vh-23rem)] min-h-[460px] w-full"
            />
            {query.loading && (
              <div className="pointer-events-none absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-muted shadow">
                Loading map reports…
              </div>
            )}
            {!query.loading && filtered.length === 0 && (
              <div className="pointer-events-none absolute inset-x-4 bottom-6 z-[500] rounded-lg border border-line bg-white/95 px-4 py-3 text-center text-xs text-muted shadow">
                No reports match the current filters in this viewport. Zoom out
                or clear filters to see more.
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-2.5 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Filters apply to the map and list
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Marker colour indicates severity
            </span>
            <span className="inline-flex items-center gap-1.5">
              <List className="h-3.5 w-3.5" />
              Select a marker or list item for details
            </span>
          </div>
        </Card>

        <div className="space-y-4">
          {selected ? (
            <HazardDetailPanel report={selected} onClose={() => setSelected(null)} />
          ) : (
            <Card className="p-4">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search title, district, or category"
                label="Search visible reports"
              />
              <p className="mt-2 text-[11px] text-muted">
                Showing {filtered.length} of {reports.length} loaded reports.
              </p>
            </Card>
          )}

          <Card className="overflow-hidden">
            <CardHeader
              title="Reports in view"
              description={selected ? "Other reports in this viewport" : "Select a report to inspect it"}
              action={
                <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted">
                  {filtered.length}
                </span>
              }
            />
            {query.loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<MapPin className="h-6 w-6" />}
                title="No reports in view"
                description="Pan the map or adjust the filters to find reports."
              />
            ) : (
              <ul className="max-h-[430px] divide-y divide-line overflow-y-auto">
                {filtered.map((report) => (
                  <li key={report.id}>
                    <button
                      type="button"
                      onClick={() => selectReport(report)}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-surface/70 ${
                        selected?.id === report.id ? "bg-brand-50/70" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-xs font-semibold text-ink">
                          {report.title}
                        </p>
                        <SeverityBadge severity={report.severity} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <HazardBadge type={report.hazard_type} showIcon={false} />
                        <StatusBadge status={report.status} />
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted">
                        {report.district ?? "Unknown district"} ·{" "}
                        {formatDate(report.created_at)} ·{" "}
                        {relativeTime(report.created_at)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-line px-4 py-2.5">
              <Link
                to="/app/reports"
                className="text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                Browse all reports
              </Link>
            </div>
          </Card>

          <MapLegend />
        </div>
      </div>
    </div>
  );
}
