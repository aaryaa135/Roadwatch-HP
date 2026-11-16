import { useState, useEffect } from "react";
import { Link } from "../router";
import { getReports } from "../api";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { StatusBadge } from "../components/badges";

const HP_CENTER: [number, number] = [31.1048, 77.1734];

interface Stat {
  label: string;
  value: string | null;
  placeholder: boolean;
}

const MODULES = [
  {
    id: "road_damage",
    title: "Road damage detection",
    description: "Detects potholes, cracks and rutting from road surface photographs.",
  },
  {
    id: "landslide",
    title: "Landslide segmentation",
    description: "Segments landslide-affected areas from 14-channel multispectral satellite imagery.",
  },
  {
    id: "rockfall_debris",
    title: "Rockfall and debris detection",
    description: "Detects rockfall and debris hazards on hill roads.",
  },
  {
    id: "flooding_waterlogging",
    title: "Flooding and waterlogging detection",
    description: "Detects flooded and waterlogged road sections.",
  },
];

const STEPS = [
  { number: 1, title: "Report a hazard", description: "Submit a photograph, location and description of the road hazard." },
  { number: 2, title: "AI analysis", description: "The report is analysed by the relevant detection module for the selected hazard type." },
  { number: 3, title: "Verification", description: "Concerned officials review the report and assign a verification status." },
  { number: 4, title: "Monitoring", description: "Verified hazards appear on the interactive GIS map for monitoring and action." },
];

export function Home() {
  const [stats, setStats] = useState<Stat[] | null>(null);
  const [statsError, setStatsError] = useState("");
  const [reports, setReports] = useState<{ id: string; title: string; hazard_type: string; status: string; district: string | null; created_at: string }[]>([]);

  useEffect(() => {
    getReports({ limit: 100 })
      .then((data) => {
        const total = data.length;
        const pending = data.filter((r) => r.status === "pending").length;
        const verified = data.filter((r) => r.status === "verified").length;
        const resolved = data.filter((r) => r.status === "resolved").length;
        setStats([
          { label: "Reports received", value: String(total), placeholder: false },
          { label: "Pending review", value: String(pending), placeholder: false },
          { label: "Verified", value: String(verified), placeholder: false },
          { label: "Resolved", value: String(resolved), placeholder: false },
        ]);
        setReports(
          data.slice(0, 6).map((r) => ({
            id: r.id,
            title: r.title,
            hazard_type: r.hazard_type,
            status: r.status,
            district: r.district ?? "—",
            created_at: r.created_at,
          }))
        );
      })
      .catch(() => {
        setStatsError("Statistics are not available at this time. Values below are placeholders only.");
        setStats([
          { label: "Reports received", value: null, placeholder: true },
          { label: "Pending review", value: null, placeholder: true },
          { label: "Verified", value: null, placeholder: true },
          { label: "Resolved", value: null, placeholder: true },
        ]);
      });
  }, []);

  return (
    <main id="main" className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Project introduction */}
        <section className="mb-10 border-b border-gray-300 pb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2">
                Government of Himachal Pradesh
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">RoadWatch HP</h1>
              <p className="text-gray-700 leading-relaxed">
                AI-powered crowdsourced road hazard detection and monitoring
                platform for Himachal Pradesh. Citizens and government
                officials can report, verify and track road hazards across the
                state through a single, formal portal.
              </p>
            </div>
            <div className="text-right hidden md:block">
              <Link to="/report" className="gov-btn">
                File a new report
              </Link>
            </div>
          </div>
        </section>

        {/* Hazard categories */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-tight mb-6">
            AI detection modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y divide-gray-300 md:divide-y-0 md:divide-x">
            {MODULES.map((module) => (
              <div
                key={module.id}
                className="p-6 border-b md:border-b-0 last:mb-0 md:last:border-b md:border-r"
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {module.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Report hazard call-to-action */}
        <section className="mb-10 border border-gray-300 bg-gray-50 p-8 text-center">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-tight mb-3">
            Report a road hazard
          </h2>
          <p className="text-sm text-gray-700 mb-6 leading-relaxed">
            Submit a photograph, location and description of the hazard.
            Reports are reviewed by the concerned authority and assigned a
            verification status.
          </p>
          <Link to="/report" className="gov-btn inline-block">
            File a new report
          </Link>
        </section>

        {/* Himachal Pradesh map section */}
        <section className="mb-10">
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-tight">
              Hazard map — Himachal Pradesh
            </h2>
            <Link to="/map" className="text-sm text-gray-600 hover:underline">
              View full map
            </Link>
          </div>
          <div
            className="border border-gray-300 aspect-video relative"
            aria-label="Interactive map of Himachal Pradesh showing reported road hazards"
          >
            <MapContainer
                center={HP_CENTER}
                zoom={7}
                className="absolute inset-0"
                style={{ zIndex: 1 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </MapContainer>
            </div>
          <p className="mt-2 text-xs text-gray-500">
            Base map &copy; OpenStreetMap contributors. Markers indicate the
            location of reported hazards.
          </p>
        </section>

        {/* Statistics section */}
        <section className="mb-10 border border-gray-300 bg-white p-6">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-tight">
              Statistics
            </h2>
            {statsError && (
              <p className="text-xs text-gray-600">{statsError}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats ? (
              stats.map((stat, i) => (
                <div
                  key={i}
                  className="border border-gray-300 p-4 text-center"
                >
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-tight mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value ?? "—"}
                  </p>
                  {stat.placeholder && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      Placeholder only
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center py-8 text-sm text-gray-500">
                No statistics available.
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Values are report counts from the database. They are not AI
            predictions and are not fabricated. Where the backend is
            unreachable, fields are shown as clearly labelled placeholders.
          </p>
        </section>

        {/* Recent reports */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-tight">
              Recent reports
            </h2>
            <Link to="/admin" className="text-sm text-gray-600 hover:underline">
              View all reports
            </Link>
          </div>
          <div className="border border-gray-300 overflow-hidden">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Type</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Reported</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-600">
                      No recent reports.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id}>
                      <td className="font-medium text-gray-900">
                        {report.title}
                      </td>
                      <td className="text-sm text-gray-700">
                        {report.hazard_type.replace(/_/g, " ")}
                      </td>
                      <td className="text-sm text-gray-700">
                        {report.district}
                      </td>
                      <td>
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="text-sm text-gray-700">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-tight mb-6">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 divide-y divide-gray-300 md:divide-y-0 md:divide-x">
            {STEPS.map((step) => (
              <div key={step.number} className="p-4 border-b md:border-b-0 last:mb-0 md:last:border-b md:border-r">
                <div className="border border-gray-300 w-8 h-8 flex items-center justify-center text-sm font-bold text-gray-900 mb-3">
                  {step.number}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
