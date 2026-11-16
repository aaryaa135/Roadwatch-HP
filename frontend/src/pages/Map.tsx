import { useCallback, useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getReports, HazardReport } from "../api";
import { Button } from "../components/Button";
import { Select } from "../components/Field";

const HIMACHAL_CENTER: [number, number] = [31.1048, 77.1734];

const HAZARD_TYPES: { value: string; label: string }[] = [
  { value: "road_damage", label: "Road damage" },
  { value: "landslide", label: "Landslide" },
  { value: "rockfall_debris", label: "Rockfall / debris" },
  { value: "flooding_waterlogging", label: "Flooding / waterlogging" },
  { value: "other", label: "Other" },
];

const SEVERITIES: { value: string; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUSES: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "resolved", label: "Resolved" },
];

function markerOptionsFor(report: HazardReport) {
  // Monochrome styling: radius by severity, stroke/fill by verification status.
  const severityRadius: Record<string, number> = {
    low: 6,
    medium: 8,
    high: 10,
    critical: 12,
  };
  const statusStyle: Record<string, { color: string; fill: boolean }> = {
    pending: { color: "#999999", fill: false },
    verified: { color: "#333333", fill: true },
    rejected: { color: "#666666", fill: false },
    resolved: { color: "#000000", fill: true },
  };

  const style = statusStyle[report.status] ?? statusStyle.pending;
  return {
    radius: severityRadius[report.severity] ?? 8,
    color: style.color,
    weight: 2,
    fill: style.fill,
    fillColor: style.fill ? "#333333" : "transparent",
    fillOpacity: 0.6,
  };
}

function MapClicker({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => {
      const { lat, lng } = event.latlng;
      onClick(lat, lng);
    },
  });
  return null;
}

export function Map() {
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [mapTarget, setMapTarget] = useState<{ lat: number; lng: number } | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getReports({
        hazard_type: filterType || undefined,
        status: filterStatus || undefined,
        severity: filterSeverity || undefined,
        limit: 500,
      });
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hazards.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterSeverity, filterStatus]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredCount = reports.length;

  const goto = (lat: number, lng: number) => {
    setMapTarget({ lat, lng });
  };

  const resetView = () => {
    setMapTarget(null);
  };

  return (
    <main id="main" className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Hazard map
        </h1>
        <p className="text-gray-700 mb-6">
          Reported road hazards across Himachal Pradesh, plotted on OpenStreetMap.
          Filters apply server-side; only reports matching all selected filters
          are shown.
        </p>

        {error && (
          <div role="alert" className="mb-4 border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900">
            {error}
          </div>
        )}

        {/* Filters */}
        <section className="mb-6 border border-gray-300 bg-white p-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select
                label="Hazard type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All types</option>
                {HAZARD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <Select
                label="Severity"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                <option value="">All severities</option>
                {SEVERITIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Select
                label="Verification status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <Button
                variant="outline"
                onClick={() => {
                  setFilterType("");
                  setFilterSeverity("");
                  setFilterStatus("");
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Showing {filteredCount} report{filteredCount === 1 ? "" : "s"}.
          </p>
        </section>

        {/* Map + legend */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9">
            <div className="border border-gray-300 aspect-video relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  Loading map&hellip;
                </div>
              ) : (
                <MapContainer
                  center={mapTarget ?? HIMACHAL_CENTER}
                  zoom={mapTarget ? 13 : 8}
                  className="absolute inset-0"
                  style={{ zIndex: 1 }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {reports.map((report) => (
                    <CircleMarker
                      key={report.id}
                      center={[
                        report.latitude,
                        report.longitude,
                      ] as [number, number]}
                      {...markerOptionsFor(report)}
                      eventHandlers={{
                        click: () => goto(report.latitude, report.longitude),
                      }}
                    >
                      <Popup>
                        <div className="text-sm min-w-[200px]">
                          <div className="font-semibold text-gray-900 mb-1">
                            {report.title}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            {report.district ?? "—"}
                          </div>
                          <div className="flex gap-2 mb-2">
                            <span className="gov-badge">
                              {report.hazard_type.replace(/_/g, " ")}
                            </span>
                            <span className="gov-badge">
                              {report.severity.charAt(0).toUpperCase() +
                                report.severity.slice(1)}
                            </span>
                            <span className="gov-badge">
                              {report.status.replace(/_/g, " ").toUpperCase()}
                            </span>
                          </div>
                          <button
                            className="gov-btn text-sm w-full"
                            onClick={() => goto(report.latitude, report.longitude)}
                          >
                            Centre on this hazard
                          </button>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                  <MapClicker onClick={goto} />
                </MapContainer>
              )}
              <button
                className="absolute bottom-4 right-4 gov-btn text-sm"
                onClick={resetView}
              >
                Reset view
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Each circle marks the location of one reported hazard. Circle
              size indicates severity; filled circles indicate verified or
              resolved reports. Click a circle for details.
            </p>
          </div>

          <div className="lg:col-span-3">
            <section className="border border-gray-300 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-tight mb-3">
                Map legend
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-tight mb-2">
                    Severity (circle size)
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-gray-900 rounded-full" aria-label="Critical severity" />
                      <span>Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 border-2 border-gray-900 rounded-full" aria-label="High severity" />
                      <span>High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 border-2 border-gray-900 rounded-full" aria-label="Medium severity" />
                      <span>Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 border-2 border-gray-900 rounded-full" aria-label="Low severity" />
                      <span>Low</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-tight mb-2">
                    Verification status (fill)
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 border-2 border-gray-900 rounded-full bg-transparent"
                        aria-label="Pending verification"
                      />
                      <span>Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 border-2 border-gray-900 rounded-full bg-gray-900"
                        aria-label="Verified"
                      />
                      <span>Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 border-2 border-gray-600 rounded-full bg-transparent"
                        aria-label="Rejected"
                      />
                      <span>Rejected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 border-2 border-black rounded-full bg-black"
                        aria-label="Resolved"
                      />
                      <span>Resolved</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-tight mb-2">
                    Hazard types
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    {HAZARD_TYPES.map((t) => (
                      <div key={t.value} className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 border border-gray-500"
                          aria-label={t.label}
                        />
                        <span>{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
