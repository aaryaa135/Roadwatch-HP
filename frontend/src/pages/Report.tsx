import { useState, useCallback } from "react";
import { createReport, uploadImage } from "../api";
import type { HazardType, Severity } from "../types";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Field";
import { Link } from "../router";
import { SeverityBadge } from "../components/badges";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"];

const HAZARD_TYPES: { value: HazardType; label: string }[] = [
  { value: "road_damage", label: "Road damage" },
  { value: "landslide", label: "Landslide" },
  { value: "rockfall_debris", label: "Rockfall and debris" },
  { value: "flooding_waterlogging", label: "Flooding and waterlogging" },
  { value: "other", label: "Other hazards" },
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

type FormData = {
  title: string;
  description: string;
  hazard_type: HazardType;
  severity: Severity;
  district: string;
  latitude: string;
  longitude: string;
};

export function Report() {
  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    hazard_type: "road_damage",
    severity: "medium",
    district: "",
    latitude: "",
    longitude: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setError("");
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      setImageUrl(null);
      return;
    }
    const ext = file.name.lastIndexOf(".") === -1 ? "" : "." + file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(
        `Unsupported file type "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.`
      );
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large. Maximum size is 10 MB.`);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const removeImage = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
  }, [imagePreview]);

  const useLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    setError("Locating…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setError("");
      },
      () =>
        setError("Unable to retrieve your location. Enter coordinates manually.")
    );
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    const latitude = parseFloat(form.latitude);
    const longitude = parseFloat(form.longitude);

    if (!form.title || !form.description || !form.district) {
      setError("Please fill all required fields.");
      return;
    }
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError("Please enter valid latitude and longitude.");
      return;
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError("Latitude must be between -90 and 90, longitude between -180 and 180.");
      return;
    }

    setSubmitting(true);
    let reportImageUrl: string | null = null;

    try {
      if (imageFile) {
        setUploading(true);
        const uploadResult = await uploadImage(imageFile);
        reportImageUrl = uploadResult.url;
        setImageUrl(uploadResult.url);
      }

      await createReport({
        title: form.title,
        description: form.description,
        hazard_type: form.hazard_type,
        severity: form.severity,
        district: form.district,
        latitude,
        longitude,
        image_urls: reportImageUrl ? [reportImageUrl] : [],
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit report."
      );
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const resetForm = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setForm({
      title: "",
      description: "",
      hazard_type: "road_damage",
      severity: "medium",
      district: "",
      latitude: "",
      longitude: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    setError("");
    setSuccess(false);
  }, [imagePreview]);

  if (success) {
    return (
      <main id="main" className="py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rw-panel text-center py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Report submitted
            </h1>
            <p className="text-gray-700 mb-6">
              Your hazard report has been received and assigned a verification
              status of pending.
            </p>
            {imageUrl && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-tight mb-1">
                  Attached image
                </p>
                <img
                  src={imageUrl}
                  alt="Uploaded report image"
                  className="border border-gray-300"
                  style={{ maxWidth: 300, maxHeight: 200 }}
                />
              </div>
            )}
            <Button onClick={resetForm}>Submit another report</Button>
            <Link to="/map" className="rw-btn-outline mt-3 inline-block">
              View hazard map
            </Link>
          </div>
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
          reviewers assess the report. Photographs are uploaded before the
          report is submitted.
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
              className="rw-btn-outline text-sm"
              disabled={submitting}
              onClick={useLocation}
            >
              {submitting ? "Submitting…" : "Use current location"}
            </button>
          </div>

          <div className="rw-field">
            <label className="rw-field-label">Photograph (optional)</label>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-900"
              onChange={handleImageChange}
            />
            {imageFile && (
              <div className="mt-3">
                <img
                  src={imagePreview!}
                  alt="Report photo preview"
                  className="border border-gray-300"
                  style={{ maxWidth: 300, maxHeight: 200 }}
                />
                <button
                  type="button"
                  className="mt-2 rw-btn-outline text-sm"
                  onClick={removeImage}
                  disabled={submitting}
                >
                  Remove image
                </button>
                <p className="mt-1 text-xs text-gray-500">
                  Selected: {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)
                </p>
              </div>
            )}
            <p className="rw-field-hint">
              Allowed types: {ALLOWED_EXTENSIONS.join(", ")}. Maximum size: 10 MB.
              The image is uploaded and its URL is stored with the report.
            </p>
          </div>

          <Button type="submit" disabled={submitting || uploading}>
            {submitting || uploading ? "Submitting…" : "Submit report"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-gray-600">
          Hazard types:
          {HAZARD_TYPES.map((t) => (
            <span key={t.value} className="mx-1">
              <SeverityBadge severity={t.value} />
            </span>
          ))}
        </p>
      </div>
    </main>
  );
}
