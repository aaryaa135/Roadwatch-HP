import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  MapPin,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { LinkButton } from "../components/ui/LinkButton";
import { Input, Select, Textarea } from "../components/ui/Form";
import { SearchInput } from "../components/ui/SearchInput";
import {
  EmptyState,
  InlineError,
  Spinner,
} from "../components/ui/States";
import { ImageUploader } from "../components/reports/ImageUploader";
import { AIAnnotation } from "../components/reports/AIAnnotation";
import { ReportProgress } from "../components/reports/ReportProgress";
import {
  HazardBadge,
  HazardIcon,
  SeverityBadge,
  StatusBadge,
} from "../components/reports/Badges";
import { LocationPicker } from "../components/map/LocationPicker";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { useDebounce } from "../hooks/useDebounce";
import {
  aiInfer,
  createReport,
  getNearbyReports,
  searchPlaces,
} from "../services/api";
import type {
  AIInferenceResult,
  HazardReport,
  HazardType,
  NewReport,
  Severity,
} from "../types";
import {
  DISTRICTS,
  HAZARD_AI_MODEL,
  HAZARD_LABELS,
  REPORTABLE_HAZARDS,
  SEVERITIES,
} from "../utils/constants";
import { formatDistance } from "../utils/format";

interface FormState {
  title: string;
  description: string;
  hazard_type: HazardType;
  severity: Severity;
  district: string;
}

const emptyForm = (district = ""): FormState => ({
  title: "",
  description: "",
  hazard_type: "potholes",
  severity: "medium",
  district,
});

export function ReportHazard() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(user?.district ?? "")
  );
  const [images, setImages] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const debouncedPlaceQuery = useDebounce(placeQuery, 550);
  const [selectedPlace, setSelectedPlace] = useState("");
  const [aiResult, setAiResult] = useState<AIInferenceResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<HazardReport | null>(null);

  useEffect(() => {
    if (user?.district && !form.district) {
      setForm((current) => ({ ...current, district: user.district ?? "" }));
    }
  }, [user?.district, form.district]);

  useEffect(() => {
    setAiResult(null);
    setAiError("");
  }, [form.hazard_type]);

  const placeQueryResult = useAsyncData(
    () =>
      debouncedPlaceQuery.trim().length >= 3
        ? searchPlaces(debouncedPlaceQuery)
        : Promise.resolve([]),
    [debouncedPlaceQuery]
  );

  const nearbyQuery = useAsyncData(
    () =>
      coords
        ? getNearbyReports({
            lat: coords.lat,
            lng: coords.lng,
            radius_m: 300,
            limit: 5,
          })
        : Promise.resolve([]),
    [coords?.lat, coords?.lng]
  );

  const updateCoords = (lat: number, lng: number) => {
    setCoords({ lat, lng });
    setLatInput(lat.toFixed(6));
    setLngInput(lng.toFixed(6));
    setLocationError("");
    setErrors((current) => ({ ...current, location: "" }));
  };

  const commitManualCoords = () => {
    if (!latInput.trim() && !lngInput.trim()) return;
    const lat = Number(latInput);
    const lng = Number(lngInput);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setLocationError("Enter a valid latitude and longitude.");
      return;
    }
    updateCoords(lat, lng);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateCoords(position.coords.latitude, position.coords.longitude);
        setLocating(false);
      },
      (error) => {
        setLocationError(
          error.message || "Unable to read your location. Pick it on the map instead."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 }
    );
  };

  const choosePlace = (lat: string, lon: string, name: string) => {
    updateCoords(Number(lat), Number(lon));
    setSelectedPlace(name);
    setPlaceQuery("");
  };

  const runAiAssist = async () => {
    const model = HAZARD_AI_MODEL[form.hazard_type];
    if (!images[0]) {
      setAiError("Attach a photograph before running AI assist.");
      return;
    }
    if (!model) {
      setAiError("AI assist is not available for this hazard category.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const result = await aiInfer(model, images[0]);
      setAiResult(result as AIInferenceResult);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : "AI assist could not be completed."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.title.trim().length < 5) {
      next.title = "Give the hazard a short, descriptive title (at least 5 characters).";
    }
    if (form.description.trim().length < 15) {
      next.description =
        "Describe the hazard and its impact (at least 15 characters).";
    }
    if (!form.district) next.district = "Select the district.";
    if (!coords) next.location = "Pick the hazard location on the map or use your location.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate() || !coords) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    try {
      const payload: NewReport = {
        title: form.title.trim(),
        description: form.description.trim(),
        hazard_type: form.hazard_type,
        severity: form.severity,
        district: form.district,
        latitude: coords.lat,
        longitude: coords.lng,
        image_urls: images,
      };
      const report = await createReport(payload);
      setCreated(report);
      toast.success("Report submitted", "Your hazard report is pending verification.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(
        "Unable to submit report",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCreated(null);
    setForm(emptyForm(user?.district ?? ""));
    setImages([]);
    setCoords(null);
    setLatInput("");
    setLngInput("");
    setLocationError("");
    setSelectedPlace("");
    setPlaceQuery("");
    setAiResult(null);
    setAiError("");
    setErrors({});
  };

  if (created) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Report submitted"
          title="Thank you for keeping Himachal roads safer"
          description="Your report has been recorded and is now pending review by a RoadWatch administrator."
        />
        <Card className="mx-auto max-w-2xl">
          <CardBody className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-ink">{created.title}</h2>
            <p className="mt-1 text-sm text-muted">
              Reference {created.id.slice(0, 8).toUpperCase()} ·{" "}
              {created.district ?? "District not recorded"}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <HazardBadge type={created.hazard_type} />
              <SeverityBadge severity={created.severity} />
              <StatusBadge status={created.status} />
            </div>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <LinkButton to={`/app/reports/${created.id}`}>
                View report
              </LinkButton>
              <Button variant="outline" onClick={resetForm}>
                Report another hazard
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const photoDone = images.length > 0;
  const locationDone = Boolean(coords);
  const detailsDone =
    form.title.trim().length >= 5 &&
    form.description.trim().length >= 15 &&
    Boolean(form.district);
  const selectedModel = HAZARD_AI_MODEL[form.hazard_type];
  const placeResults = placeQueryResult.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Citizen reporting"
        title="Report a road hazard"
        description="Share the location, a photograph, and a short description. Reports are reviewed before they are marked verified."
        actions={
          <LinkButton to="/app/map" variant="outline" icon={<MapPin className="h-4 w-4" />}>
            View hazard map
          </LinkButton>
        }
      />

      <Card className="p-4">
        <ReportProgress
          photoDone={photoDone}
          locationDone={locationDone}
          detailsDone={detailsDone}
          reviewDone={false}
        />
      </Card>

      <form onSubmit={submit} noValidate>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Card>
              <CardHeader
                title="1. Photograph"
                description="Attach clear photographs of the hazard. The first image is the primary photo."
              />
              <CardBody className="space-y-4">
                <ImageUploader value={images} onChange={setImages} />
                <div className="rounded-lg border border-line bg-surface/50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                        <Sparkles className="h-3.5 w-3.5 text-brand-700" />
                        AI visual assist
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        Optional. Runs a visual model against the primary photograph.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={runAiAssist}
                      loading={aiLoading}
                      disabled={!images[0] || !selectedModel}
                      icon={<Sparkles className="h-3.5 w-3.5" />}
                    >
                      Run AI assist
                    </Button>
                  </div>
                  {!selectedModel && (
                    <p className="mt-3 text-[11px] text-muted">
                      AI assist is not available for{" "}
                      {HAZARD_LABELS[form.hazard_type] ?? form.hazard_type}. You
                      can still submit the report.
                    </p>
                  )}
                  {aiError && (
                    <div className="mt-3">
                      <InlineError>{aiError}</InlineError>
                    </div>
                  )}
                  {aiLoading && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                      <Spinner className="h-4 w-4" />
                      Analysing the photograph…
                    </div>
                  )}
                  {aiResult && !aiLoading && (
                    <div className="mt-3">
                      <AIAnnotation result={aiResult} />
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="2. Location"
                description="Search for a place, use your current location, or click the map to drop a pin."
              />
              <CardBody className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="relative">
                    <SearchInput
                      value={placeQuery}
                      onChange={setPlaceQuery}
                      placeholder="Search a town, road, or landmark in HP"
                      label="Search for a location"
                    />
                    {placeQuery.trim().length >= 3 && (
                      <div className="absolute z-[600] mt-1 w-full overflow-hidden rounded-lg border border-line bg-white shadow-float">
                        {placeQueryResult.loading ? (
                          <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted">
                            <Spinner className="h-4 w-4" />
                            Searching…
                          </div>
                        ) : placeQueryResult.error ? (
                          <p className="px-3 py-3 text-xs text-severity-high">
                            {placeQueryResult.error}
                          </p>
                        ) : placeResults.length === 0 ? (
                          <p className="px-3 py-3 text-xs text-muted">
                            No places found. Try a nearby town or landmark.
                          </p>
                        ) : (
                          <ul className="max-h-56 overflow-y-auto">
                            {placeResults.map((place) => (
                              <li key={`${place.lat}-${place.lon}`}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    choosePlace(place.lat, place.lon, place.display_name)
                                  }
                                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-xs text-ink hover:bg-surface"
                                >
                                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                                  <span className="line-clamp-2">{place.display_name}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={useMyLocation}
                    loading={locating}
                    icon={<Crosshair className="h-4 w-4" />}
                    className="sm:self-start"
                  >
                    Use my location
                  </Button>
                </div>

                {selectedPlace && (
                  <p className="flex items-start gap-1.5 text-xs text-muted">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {selectedPlace}
                  </p>
                )}
                {locationError && <InlineError>{locationError}</InlineError>}

                <div className="overflow-hidden rounded-lg border border-line">
                  <LocationPicker
                    value={coords}
                    onChange={updateCoords}
                    className="h-64 w-full"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Latitude"
                    inputMode="decimal"
                    value={latInput}
                    onChange={(event) => setLatInput(event.target.value)}
                    onBlur={commitManualCoords}
                    placeholder="e.g. 31.104800"
                  />
                  <Input
                    label="Longitude"
                    inputMode="decimal"
                    value={lngInput}
                    onChange={(event) => setLngInput(event.target.value)}
                    onBlur={commitManualCoords}
                    placeholder="e.g. 77.173400"
                  />
                </div>
                {errors.location && (
                  <p className="text-xs font-medium text-severity-high">
                    {errors.location}
                  </p>
                )}
                <Select
                  label="District"
                  required
                  value={form.district}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      district: event.target.value,
                    }))
                  }
                  error={errors.district}
                >
                  <option value="">Select district</option>
                  {DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </Select>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="3. Details"
                description="Choose the closest category and describe what you observed."
              />
              <CardBody className="space-y-5">
                <Input
                  label="Report title"
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="e.g. Deep pothole near Dhalli bypass"
                  maxLength={200}
                  error={errors.title}
                />

                <div>
                  <p className="rw-label">Hazard category</p>
                  <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                    {REPORTABLE_HAZARDS.map((category) => {
                      const active = form.hazard_type === category.code;
                      return (
                        <button
                          key={category.code}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              hazard_type: category.code,
                            }))
                          }
                          className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors ${
                            active
                              ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                              : "border-line bg-white hover:border-brand-300 hover:bg-surface/60"
                          }`}
                          aria-pressed={active}
                        >
                          <span
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                              active ? "bg-brand-700 text-white" : "bg-surface text-muted"
                            }`}
                          >
                            <HazardIcon type={category.code} className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold text-ink">
                              {category.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                              {category.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="rw-label">Severity</p>
                  <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                    {SEVERITIES.map((severity) => {
                      const active = form.severity === severity.code;
                      return (
                        <button
                          key={severity.code}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              severity: severity.code,
                            }))
                          }
                          className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors ${
                            active
                              ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                              : "border-line bg-white hover:border-brand-300 hover:bg-surface/60"
                          }`}
                          aria-pressed={active}
                        >
                          <span
                            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: severity.color }}
                          />
                          <span>
                            <span className="block text-xs font-semibold text-ink">
                              {severity.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                              {severity.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Textarea
                    label="Description"
                    required
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Describe the hazard, its size, and any immediate risk to road users."
                    rows={5}
                    maxLength={2000}
                    error={errors.description}
                  />
                  <p className="mt-1 text-right text-[11px] text-muted">
                    {form.description.length}/2000
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="4. Review and submit"
                description="Check the report details before submitting it for verification."
              />
              <CardBody className="space-y-4">
                <dl className="grid gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-muted">Category</dt>
                    <dd className="mt-1">
                      <HazardBadge type={form.hazard_type} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Severity</dt>
                    <dd className="mt-1">
                      <SeverityBadge severity={form.severity} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">District</dt>
                    <dd className="mt-1 font-medium text-ink">
                      {form.district || "Not selected"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Coordinates</dt>
                    <dd className="mt-1 font-medium text-ink">
                      {coords
                        ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                        : "Not selected"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Photographs</dt>
                    <dd className="mt-1 font-medium text-ink">{images.length} attached</dd>
                  </div>
                  <div>
                    <dt className="text-muted">AI confidence</dt>
                    <dd className="mt-1 font-medium text-ink">
                      {aiResult ? "Included as an assist only" : "Not run"}
                    </dd>
                  </div>
                </dl>
                <p className="rounded-lg border border-line bg-surface/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
                  By submitting, you confirm the information is accurate to the
                  best of your knowledge. Reports are published after review and
                  may be rejected if they cannot be verified.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="submit"
                    loading={submitting}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Submit report
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Clear form
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4 self-start xl:sticky xl:top-4">
            <Card>
              <CardHeader title="Report checklist" />
              <CardBody className="space-y-2.5">
                {[
                  { label: "Photograph attached", done: photoDone },
                  { label: "Location selected", done: locationDone },
                  { label: "Title and description", done: detailsDone },
                  { label: "Ready to submit", done: photoDone && locationDone && detailsDone },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        item.done
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-surface text-muted"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                    <span className={item.done ? "text-ink" : "text-muted"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Possible nearby reports"
                description="Same-area hazards reported in the last 300 m."
              />
              <CardBody className="p-0">
                {!coords ? (
                  <EmptyState
                    icon={<MapPin className="h-6 w-6" />}
                    title="Pick a location"
                    description="Nearby reports will be checked once a location is selected."
                  />
                ) : nearbyQuery.loading ? (
                  <div className="flex items-center gap-2 px-4 py-6 text-xs text-muted">
                    <Spinner className="h-4 w-4" />
                    Checking nearby reports…
                  </div>
                ) : (nearbyQuery.data ?? []).length === 0 ? (
                  <EmptyState
                    icon={<CheckCircle2 className="h-6 w-6" />}
                    title="No nearby reports"
                    description="No similar hazards were found within 300 metres."
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {(nearbyQuery.data ?? []).map((report) => (
                      <li key={report.id}>
                        <Link
                          to={`/app/reports/${report.id}`}
                          className="block px-4 py-3 hover:bg-surface/70"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-xs font-semibold text-ink">
                              {report.title}
                            </p>
                            <span className="shrink-0 text-[11px] font-medium text-muted">
                              {formatDistance(report.distance_m)}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            <HazardBadge type={report.hazard_type} showIcon={false} />
                            <StatusBadge status={report.status} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {(nearbyQuery.data ?? []).length > 0 && (
                  <div className="flex items-start gap-2 border-t border-line bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-800">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Check whether this is the same hazard before submitting a new
                    report.
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Reporting guidance" />
              <CardBody className="space-y-2 text-[11px] leading-relaxed text-muted">
                <p>Keep a safe distance from traffic while photographing.</p>
                <p>Include a landmark or road name in the title when possible.</p>
                <p>Describe the size and immediate risk of the hazard.</p>
                <p>Use the closest category; administrators can refine details.</p>
                <p>Do not include personal information in photographs.</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
