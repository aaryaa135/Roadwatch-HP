import { useState, useEffect } from "react";
import { createReport } from "../api";
import type { HazardType, Severity } from "../types";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Field";
import { HazardTypeIcon } from "../components/badges";

const HAZARD_TYPES: { value: HazardType; label: string }[] = [
  { value: "road_damage", label: "Road damage (pothole, crack, rutting)" },
  { value: "landslide", label: "Landslide" },
  { value: "rockfall_debris", label: "Rockfall and debris" },
  { value: "flooding_waterlogging", label: "Flooding and waterlogging" },
  { value: "other", label: "Other" },
];

const SEVERITIES: { value: Severity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const DISTRICTS = [
  "Bilaspur",
  "Chamba",
  "Hamirpur",
  "Kangra",
  "Kinnaur",
  "Kullu",
  "Lahaul and Spiti",
  "Mandi",
  "Shimla",
  "Sirmaur",
  "Solan",
  "Una",
];

export function Report() {
  const [form, setForm] = useState<{
    title: string;
    description: string;
    hazard_type: HazardType;
    severity: Severity;
    district: string;
    latitude: string;
    longitude: string;
  }>({
    title: "",
    description: "",
    hazard_type: "road_damage",
    severity: "medium",
    district: "",
    latitude: "",
    longitude: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const target = (window as any).__roadwatchMapTarget;
    if (target) {
      setForm((prev) => ({
        ...prev,
        latitude: target.lat.toFixed(6),
        longitude: target.lng.toFixed(6),
      }));
      (window as any).__roadwatchMapTarget = null;
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const latitude = parseFloat(form.latitude);
    const longitude = parseFloat(form.longitude);
    if (
      !form.title ||
      !form.description ||
      !form.district ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      setError("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await createReport({
        title: form.title,
        description: form.description,
        hazard_type: form.hazard_type,
        severity: form.severity,
        district: form.district,
        latitude,
        longitude,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    setError("Locating&hellip;");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setError("");
      },
      () => setError("Unable to retrieve your location. Enter coordinates manually.")
    );
  };

  if (submitted) {
    return (
      <main id="main" className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Report submitted
          </h1>
          <p className="text-gray-700 mb-6">
            Your hazard report has been received. It will be reviewed by the
            concerned authority and assigned a verification status.
          </p>
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            Submit another report
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="py-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Report a road hazard
        </h1>
        <p className="text-gray-700 mb-6">
          Provide details of the hazard and its location. A photograph helps
          the verification team assess the report.
        </p>

        {error && (
          <div role="alert" className="mb-4 border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 border border-gray-300 p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Title of the hazard"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Pothole near NH-5, Shimla"
            />
            <Select
              label="Hazard type"
              required
              value={form.hazard_type}
              onChange={(e) =>
                setForm({ ...form, hazard_type: e.target.value as HazardType })
              }
            >
              {HAZARD_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Severity"
              required
              value={form.severity}
              onChange={(e) =>
                setForm({ ...form, severity: e.target.value as Severity })
              }
            >
              {SEVERITIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="District"
              required
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            >
              <option value="">Select district</option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Description"
            required
            hint="Describe the hazard, road name, nearby landmark, and any visible details."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Latitude"
              required
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              type="number"
              step="any"
            />
            <Input
              label="Longitude"
              required
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              type="number"
              step="any"
            />
          </div>

          <div className="flex gap-2 items-start">
            <button
              type="button"
              className="gov-btn-outline text-sm"
              onClick={useLocation}
            >
              Use current location
            </button>
          </div>

          <div className="gov-field">
            <label className="gov-field-label">Photograph (optional)</label>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-900"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setPhotoUrl(file ? URL.createObjectURL(file) : null);
              }}
            />
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Report photo preview"
                className="mt-3 border border-gray-300"
                style={{ maxWidth: 300, maxHeight: 200 }}
              />
            )}
            <p className="gov-field-hint">
              Photographs are analysed by AI detection modules where applicable.
            </p>
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting&hellip;" : "Submit report"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-gray-600">
          Hazard types:{" "}
          {HAZARD_TYPES.map((t) => (
            <span key={t.value} className="mx-1">
              <HazardTypeIcon type={t.value} />
            </span>
          ))}
        </p>
      </div>
    </main>
  );
}
