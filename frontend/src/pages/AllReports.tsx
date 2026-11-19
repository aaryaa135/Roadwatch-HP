import { useEffect, useMemo, useState } from "react";
import {
  LayoutList,
  Map as MapIcon,
  Plus,
  SearchX,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { LinkButton } from "../components/ui/LinkButton";
import { SearchInput } from "../components/ui/SearchInput";
import { Select } from "../components/ui/Form";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState, Skeleton } from "../components/ui/States";
import { ReportFilters } from "../components/reports/ReportFilters";
import type { ReportFilterState } from "../components/reports/ReportFilters";
import { EMPTY_REPORT_FILTERS } from "../components/reports/ReportFilters";
import { ReportTable } from "../components/reports/ReportTable";
import { MapView } from "../components/map/MapView";
import { useAsyncData } from "../hooks/useAsyncData";
import { useDebounce } from "../hooks/useDebounce";
import { getReports } from "../services/api";
import { HP_CENTER } from "../utils/constants";
import { cn } from "../utils/format";

const PAGE_SIZE = 12;

const sortOptions = {
  newest: { label: "Newest first", sort_by: "created_at", sort_dir: "desc" },
  oldest: { label: "Oldest first", sort_by: "created_at", sort_dir: "asc" },
  title: { label: "Title A–Z", sort_by: "title", sort_dir: "asc" },
  district: { label: "District A–Z", sort_by: "district", sort_dir: "asc" },
} as const;

type SortKey = keyof typeof sortOptions;

export function AllReports() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [filters, setFilters] = useState<ReportFilterState>(EMPTY_REPORT_FILTERS);
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "map">("list");

  const sortConfig = sortOptions[sort];

  const query = useAsyncData(
    () =>
      getReports({
        search: debouncedSearch.trim() || undefined,
        hazard_type: filters.hazard_type || undefined,
        severity: filters.severity || undefined,
        status: filters.status || undefined,
        district: filters.district || undefined,
        sort_by: sortConfig.sort_by,
        sort_dir: sortConfig.sort_dir,
        limit: 500,
      }),
    [
      debouncedSearch,
      filters.hazard_type,
      filters.severity,
      filters.status,
      filters.district,
      sortConfig.sort_by,
      sortConfig.sort_dir,
    ]
  );

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    filters.hazard_type,
    filters.severity,
    filters.status,
    filters.district,
    sort,
  ]);

  const reports = query.data ?? [];
  const pageCount = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageReports = useMemo(
    () =>
      reports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [reports, currentPage]
  );

  const hasFilters =
    Boolean(debouncedSearch) ||
    Boolean(filters.hazard_type) ||
    Boolean(filters.severity) ||
    Boolean(filters.status) ||
    Boolean(filters.district);

  const resetAll = () => {
    setSearch("");
    setFilters(EMPTY_REPORT_FILTERS);
    setSort("newest");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Report register"
        title="All hazard reports"
        description="Search, filter, and review every road-hazard report recorded across Himachal Pradesh."
        actions={
          <LinkButton to="/app/report" icon={<Plus className="h-4 w-4" />}>
            Report hazard
          </LinkButton>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by title, description, or district"
              label="Search reports"
            />
          </div>
          <div className="w-full sm:w-52">
            <Select
              label="Sort by"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
            >
              {Object.entries(sortOptions).map(([key, option]) => (
                <option key={key} value={key}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex rounded-lg border border-line bg-white p-0.5">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold",
                view === "list" ? "bg-charcoal-900 text-white" : "text-muted hover:text-ink"
              )}
              aria-pressed={view === "list"}
            >
              <LayoutList className="h-3.5 w-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold",
                view === "map" ? "bg-charcoal-900 text-white" : "text-muted hover:text-ink"
              )}
              aria-pressed={view === "map"}
            >
              <MapIcon className="h-3.5 w-3.5" />
              Map
            </button>
          </div>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <ReportFilters
            value={filters}
            onChange={setFilters}
            onReset={() => setFilters(EMPTY_REPORT_FILTERS)}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <p>
            <span className="font-semibold text-ink">{reports.length}</span>{" "}
            matching report{reports.length === 1 ? "" : "s"}
            {reports.length === 500 && " (limited to 500)"}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetAll}
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Clear all filters
            </button>
          )}
        </div>
      </Card>

      {view === "list" ? (
        <Card className="overflow-hidden">
          <CardHeader
            title="Report results"
            description="Select a report to view its full details and verification history."
            action={
              <span className="text-[11px] text-muted">
                Page {currentPage} of {pageCount}
              </span>
            }
          />
          <ReportTable
            reports={pageReports}
            loading={query.loading}
            error={query.error}
            onRetry={query.reload}
            emptyTitle={hasFilters ? "No matching reports" : "No reports yet"}
            emptyDescription={
              hasFilters
                ? "Try removing a filter or using a broader search term."
                : "Submit the first hazard report to start the register."
            }
          />
          {!query.loading && !query.error && reports.length > 0 && (
            <Pagination
              page={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={reports.length}
              onPageChange={setPage}
            />
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader
            title="Report map"
            description="All matching reports plotted by severity. Select a marker for a summary."
            action={
              <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                <SearchX className="h-3.5 w-3.5" />
                {reports.length} plotted
              </span>
            }
          />
          {query.loading ? (
            <Skeleton className="h-[560px] w-full rounded-none" />
          ) : query.error ? (
            <EmptyState
              icon={<SearchX className="h-6 w-6" />}
              title="Unable to load the map"
              description={query.error}
            />
          ) : reports.length === 0 ? (
            <EmptyState
              icon={<MapIcon className="h-6 w-6" />}
              title="No reports to plot"
              description="Adjust the filters or submit a new report."
            />
          ) : (
            <MapView
              reports={reports}
              center={HP_CENTER}
              zoom={8}
              fitToReports
              className="h-[560px] w-full"
            />
          )}
        </Card>
      )}
    </div>
  );
}
