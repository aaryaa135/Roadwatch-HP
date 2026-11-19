import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Camera,
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  MapPinned,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Waypoints,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { HazardIcon } from "../components/reports/Badges";
import { REPORTABLE_HAZARDS } from "../utils/constants";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2400&q=80";

const steps = [
  {
    icon: Camera,
    title: "Capture",
    description:
      "A citizen photographs a road hazard and attaches GPS coordinates from the field.",
  },
  {
    icon: ScanSearch,
    title: "Detect",
    description:
      "The AI service analyses the image for the relevant hazard model and returns confidence and detections.",
  },
  {
    icon: ShieldCheck,
    title: "Verify",
    description:
      "Authorised reviewers inspect the report, AI output and possible duplicates before verification.",
  },
  {
    icon: Activity,
    title: "Monitor",
    description:
      "Verified hazards appear on the live GIS map and feed the analytics workspace.",
  },
];

const features = [
  {
    icon: MapPinned,
    title: "Interactive GIS map",
    description:
      "Explore clustered hazard markers across Himachal Pradesh with category, severity and verification filters.",
  },
  {
    icon: Sparkles,
    title: "AI-assisted detection",
    description:
      "Model confidence is shown separately from severity. When model weights are unavailable, the platform says so instead of inventing a result.",
  },
  {
    icon: TriangleAlert,
    title: "Severity assessment",
    description:
      "Low, medium, high and critical severity grades are tracked independently from AI confidence and verification.",
  },
  {
    icon: Layers,
    title: "Duplicate awareness",
    description:
      "Nearby reports of the same category are surfaced for reviewers before a decision is made.",
  },
  {
    icon: ShieldCheck,
    title: "Verification workflow",
    description:
      "A clear audit trail records verification, rejection and resolution actions with reviewer remarks.",
  },
  {
    icon: Database,
    title: "Real analytics",
    description:
      "Charts are generated from stored reports. No fabricated statistics and no synthetic production data.",
  },
];

const technology = [
  { label: "React + TypeScript", detail: "Application shell and interactions" },
  { label: "Leaflet + OpenStreetMap", detail: "GIS map and base tiles" },
  { label: "FastAPI", detail: "Report, auth and verification API" },
  { label: "PostgreSQL + PostGIS", detail: "Geospatial report storage" },
  { label: "AI inference service", detail: "Hazard-specific model adapters" },
  { label: "Recharts", detail: "Operational analytics" },
];

export function Landing() {
  const [heroImageOk, setHeroImageOk] = useState(true);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-charcoal-900">
        <div className="absolute inset-0">
          {heroImageOk && (
            <img
              src={HERO_IMAGE}
              alt="Mountain road in the Himalayas"
              className="h-full w-full object-cover"
              onError={() => setHeroImageOk(false)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/90 via-charcoal-950/70 to-charcoal-900/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(53,106,77,0.35),transparent_55%)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:px-8 lg:pb-28 lg:pt-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur">
              <Waypoints className="h-3.5 w-3.5 text-brand-300" />
              Road intelligence for Himachal Pradesh
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Smarter Roads.
              <br />
              <span className="text-brand-300">Safer Journeys.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              RoadWatch HP is an AI-powered geospatial platform for real-time
              road hazard detection and smart road monitoring. Report what you
              see, explore verified hazards on the map, and help build a safer
              road network across the state.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/app/map">
                <Button size="lg" icon={<MapPinned className="h-4 w-4" />}>
                  Explore hazard map
                </Button>
              </Link>
              <Link to="/app/report">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                  icon={<Camera className="h-4 w-4" />}
                >
                  Report a hazard
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/45">
              Sign in to submit reports and access the monitoring workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {[
              { value: "10", label: "Hazard categories" },
              { value: "4", label: "AI model families" },
              { value: "GIS", label: "Live map layer" },
              { value: "Audit", label: "Verification trail" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="text-2xl font-bold text-white">{item.value}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/45">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs font-medium text-muted sm:px-6 lg:px-8">
          <span className="uppercase tracking-[0.16em] text-ink/50">
            Built with open and auditable tools
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>OpenStreetMap</span>
            <span>PostGIS</span>
            <span>FastAPI</span>
            <span>PyTorch adapters</span>
            <span>React</span>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                From a roadside photograph to a verified hazard record.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                Every report moves through a transparent workflow. AI output is
                an input to review, not a substitute for it. Reviewers remain
                accountable for verification and resolution.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                Human review before verification
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                Confidence and severity kept separate
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-xl border border-line bg-white p-5 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-muted">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
              Project features
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              A monitoring workspace, not a static report form.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              RoadWatch HP combines geospatial exploration, AI-assisted
              inspection, review workflows and operational analytics in one
              consistent interface.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-line bg-white p-5 transition-colors hover:border-brand-200 hover:bg-brand-50/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-brand-700 transition-colors group-hover:bg-white">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="hazards" className="scroll-mt-20 border-y border-line bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                Supported hazard categories
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Ten categories built for hill roads.
              </h2>
            </div>
            <Link
              to="/app/map"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              View on map <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {REPORTABLE_HAZARDS.map((hazard) => (
              <div
                key={hazard.code}
                className="rounded-xl border border-line bg-white p-4"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-brand-700">
                  <HazardIcon type={hazard.code} className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-ink">
                  {hazard.label}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {hazard.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="technology" className="scroll-mt-20 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                Technology overview
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                A geospatial stack designed for real operations.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                The frontend consumes the existing FastAPI contracts directly.
                Report images are uploaded before submission, AI inference is
                performed server-side, and map coordinates come from stored
                PostGIS points rather than fabricated client-side data.
              </p>
              <div className="mt-6 rounded-xl border border-line bg-surface p-4">
                <div className="flex items-start gap-3">
                  <Cpu className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
                  <p className="text-xs leading-relaxed text-muted">
                    If a hazard model has no trained weights, the platform
                    reports that no model output is available. It never presents
                    a fabricated confidence score as a real detection.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {technology.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-line bg-white p-4"
                >
                  <p className="text-sm font-semibold text-ink">{item.label}</p>
                  <p className="mt-1 text-xs text-muted">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-20 border-t border-line bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                About the project
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Road safety intelligence for a Himalayan state.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Himachal Pradesh's road network is exposed to landslides,
                rockfalls, flooding, surface deterioration and seasonal
                obstruction. RoadWatch HP was developed as a final-year B.Tech
                Computer Science major project to demonstrate how crowdsourced
                reporting, computer vision and geospatial monitoring can work
                together in a practical public-safety workflow.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                The platform is deliberately honest about its data: statistics
                are computed from stored reports, AI confidence is not treated as
                severity, and administrative actions are recorded in an audit
                trail.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                {
                  title: "Citizen reporting",
                  text: "Image, GPS coordinates, category and description in one guided flow.",
                },
                {
                  title: "Reviewer workflow",
                  text: "Pending queue, duplicate awareness, remarks and status history.",
                },
                {
                  title: "Operational view",
                  text: "Map, dashboard and analytics from the same report source of truth.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-line bg-white p-5">
                  <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-charcoal-900 py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Help keep Himachal Pradesh moving safely.
            </h2>
            <p className="mt-2 text-sm text-white/55">
              Create an account, report a hazard, or explore the live map.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/register">
              <Button size="lg">Create account</Button>
            </Link>
            <Link to="/app/map">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                Explore map
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
