import { useState, useEffect } from "react";
import { getReports, updateReport, deleteReport, HazardReport } from "../api";
import { Button } from "../components/Button";
import { Select } from "../components/Field";
import { StatusBadge, SeverityBadge } from "../components/badges";

const STATUSES: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "resolved", label: "Resolved" },
];

const HAZARD_TYPES = [
  { value: "road_damage", label: "Road damage" },
  { value: "landslide", label: "Landslide" },
  { value: "rockfall_debris", label: "Rockfall / debris" },
  { value: "flooding_waterlogging", label: "Flooding / waterlogging" },
  { value: "other", label: "Other" },
];

const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function Admin() {
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Partial<HazardReport>>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    setError("");
    try {
      setReports(await getReports());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = reports.filter(
    (r) =>
      (!filterType || r.hazard_type === filterType) &&
      (!filterSeverity || r.severity === filterSeverity) &&
      (!filterStatus || r.status === filterStatus)
  );

  async function saveReport(id: string) {
    const patch = edits[id];
    if (!patch) return;
    try {
      const updated = await updateReport(id, patch);
      setReports((list) => list.map((r) => (r.id === id ? updated : r)));
      setEditing(null);
      setEdits({});
      setSuccess("Report updated successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function removeReport(id: string) {
    if (!window.confirm("Delete this report?")) return;
    setDeleting(id);
    try {
      await deleteReport(id);
      setReports((list) => list.filter((r) => r.id !== id));
      if (editing === id) setEditing(null);
      setSuccess("Report deleted successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(null);
    }
  }

  const notice = (
    <div className="mb-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold mb-1">
        Notice: this admin area is unauthenticated and intended for
        development/demo use only.
      </p>
      <p>There is no authentication or role-based access control.</p>
    </div>
  );

  if (loading) {
    return (
      <main id="main" className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {notice}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Report management
          </h1>
          <div className="flex items-center justify-center py-16 text-gray-500">
            Loading reports…
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {notice}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Report management
        </h1>
        <p className="text-gray-700 mb-6">
          Review and update the status of reported road hazards.
        </p>

        {error && (
          <div role="alert" className="mb-4 border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900">
            {success}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
          <div className="flex-1 md:w-64">
            <Select
              label="Filter by hazard type"
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
          <div className="flex-1 md:w-64">
            <Select
              label="Filter by severity"
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
          <div className="flex-1 md:w-64">
            <Select
              label="Filter by status"
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
        </div>

        <div className="border border-gray-300 overflow-hidden">
          <table className="rw-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Type</th>
                <th>Severity</th>
                <th>District</th>
                <th>Status</th>
                <th>Reported</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-600">
                    No reports found.
                  </td>
                </tr>
              ) : (
                filtered.map((report) => (
                  <tr key={report.id} className={editing === report.id ? "bg-gray-50" : ""}>
                    <td>
                      <div className="font-medium text-gray-900">{report.title}</div>
                      <div className="text-xs text-gray-500">{report.id}</div>
                    </td>
                    <td>{report.hazard_type.replace(/_/g, " ")}</td>
                    <td>
                      <SeverityBadge severity={report.severity} />
                    </td>
                    <td>{report.district || "—"}</td>
                    <td><StatusBadge status={report.status} /></td>
                    <td>{new Date(report.created_at).toLocaleDateString()}</td>
                    <td>
                      {editing === report.id ? (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            onClick={() => saveReport(report.id)}
                            disabled={!edits[report.id] || Object.keys(edits[report.id] || {}).length === 0}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditing(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditing(report.id);
                            setEdits((prev) => ({ ...prev, [report.id]: {} }));
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => removeReport(report.id)}
                        disabled={deleting === report.id}
                      >
                        {deleting === report.id ? "Deleting…" : "Delete"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Total reports: {reports.length}
        </p>
      </div>
    </main>
  );
}
