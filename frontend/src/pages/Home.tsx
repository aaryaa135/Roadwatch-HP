import { useState, useEffect } from "react";
import { Link } from "../router";
import { getReports } from "../api";
import { StatusBadge } from "../components/badges";

const HAZARD_CATEGORIES = [
  {
    id: "landslide",
    label: "Landslide",
    description: "Slippage of earth, rock or debris onto the road.",
  },
  {
    id: "road_damage",
    label: "Road damage",
    description: "Potholes, cracks, rutting and surface breakup.",
  },
  {
    id: "rockfall_debris",
    label: "Rockfall and debris",
    description: "Falling rocks or debris blocking the roadway.",
  },
  {
    id: "flooding_waterlogging",
    label: "Flooding and waterlogging",
    description: "Standing water or flooded road sections.",
  },
  {
    id: "other",
    label: "Other hazards",
    description: "Any other road hazard not listed above.",
  },
];

const STEPS = [
  {
    number: 1,
    title: "Report a hazard",
    description: "Submit a photograph, location and description of the road hazard.",
  },
  {
    number: 2,
    title: "Review",
    description: "Reports are reviewed and assigned a verification status.",
  },
  {
    number: 3,
    title: "Monitor",
    description: "Verified hazards appear on the interactive map for action.",
  },
];

interface Stat {
  label: string;
  value: string | null;
}

interface RecentReport {
  id: string;
  title: string;
  hazard_type: string;
  status: string;
  district: string | null;
  created_at: string;
}

export function Home() {
  const [stats, setStats] = useState<Stat[] | null>(null);
  const [statsError, setStatsError] = useState("");
  const [reports, setReports] = useState<RecentReport[]>([]);
  const [reportsError, setReportsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getReports({ limit: 100 })
      .then((data) => {
        if (cancelled) return;
        const total = data.length;
        const pending = data.filter((r) => r.status === "pending").length;
        const verified = data.filter((r) => r.status === "verified").length;
        const resolved = data.filter((r) => r.status === "resolved").length;
        setStats([
          { label: "Reports received", value: String(total) },
          { label: "Pending review", value: String(pending) },
          { label: "Verified", value: String(verified) },
          { label: "Resolved", value: String(resolved) },
        ]);
        setReports(
          data
            .slice(0, 6)
            .map((r): RecentReport => ({
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
        if (cancelled) return;
        setStatsError("Statistics are unavailable right now.");
        setReportsError("Recent reports are unavailable right now.");
        setStats([]);
        setReports([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main id="main" className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <section className="mb-12 border-b border-gray-300 pb-8">
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2">
              RoadWatch HP
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Community road hazard reporting for Himachal Pradesh
            </h1>
            <p className="text-lg text-gray-700 leading-relaxed mb-8 max-w-2xl mx-auto">
              RoadWatch HP is an independent, community-driven platform for
              reporting and monitoring road hazards across Himachal Pradesh.
              Landslides, road damage, rockfall, flooding and other hazards can
              be reported by anyone and reviewed for verification.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/report" className="rw-btn">
                Report a Hazard
              </Link>
              <Link to="/map" className="rw-btn-outline">
                Explore Hazard Map
              </Link>
            </div>
          </div>
        </section>

        {/* Problem statement */}
        <section className="mb-12">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-tight mb-6">
            The problem
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6 max-w-3xl">
             Road hazards on Himachal Pradesh's hill roads — landslides,
            potholes, rockfall and flooding — can appear suddenly and put
            travelers at risk. There is no simple, central place for citizens to
            report these hazards and track their resolution. RoadWatch HP closes
            that gap by collecting reports, plotting them on a map, and giving
            reviewers a way to verify and act on them.
          </p>
        </section>

        {/* Hazard categories */}
        <section className="mb-12">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-tight">
              Hazard categories
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border border-gray-300">
            {HAZARD_CATEGORIES.map((category) => (
              <div key={category.id} className="p-4 border-b border-gray-300 lg:border-b-0 lg:border-r last:border-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {category.label}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-12">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-tight mb-6">
            Platform statistics
          </h2>
          {statsError ? (
            <div className="rw-panel text-center py-8">
              <p className="text-sm text-gray-600">{statsError}</p>
              <p className="mt-2 text-xs text-gray-500">
                Statistics are computed from real reports in the backend.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats?.length ? (
                stats.map((stat) => (
                  <div key={stat.label} className="border border-gray-300 p-4 text-center">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-tight mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-center py-8 text-sm text-gray-500">
                  No statistics available.
                </div>
              )}
            </div>
          )}
          <p className="mt-4 text-xs text-gray-500">
            Statistics are computed from reports stored in the backend and are
            not estimated or fabricated.
          </p>
        </section>

        {/* Recent reports */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-tight">
              Recent reports
            </h2>
            <Link to="/admin" className="text-sm text-gray-600 hover:underline">
              View all reports
            </Link>
          </div>
          <div className="border border-gray-300 overflow-hidden">
            <table className="rw-table">
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
                {reportsError || (stats === null && reports.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-600">
                      Recent reports are unavailable right now.
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y divide-gray-300 md:divide-y-0 md:divide-x">
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
