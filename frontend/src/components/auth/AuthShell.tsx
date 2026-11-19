import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MapPinned, ShieldCheck, Waypoints } from "lucide-react";
import { Logo } from "../brand/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-charcoal-900 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-30">
          <svg viewBox="0 0 600 800" className="h-full w-full" aria-hidden="true">
            <defs>
              <pattern
                id="grid"
                width="44"
                height="44"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 44 0 L 0 0 0 44"
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity="0.08"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="600" height="800" fill="url(#grid)" />
            <path
              d="M-40 620 C120 520 160 420 300 380 C440 340 470 210 660 160"
              fill="none"
              stroke="#46805f"
              strokeWidth="3"
              strokeDasharray="10 10"
            />
            <path
              d="M-40 660 C140 560 180 460 320 420 C460 380 500 250 680 200"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.16"
              strokeWidth="2"
            />
            <circle cx="300" cy="380" r="7" fill="#92bda3" />
            <circle cx="320" cy="420" r="5" fill="#ffffff" fillOpacity="0.5" />
          </svg>
        </div>
        <div className="relative">
          <Link to="/" aria-label="RoadWatch HP home">
            <Logo light />
          </Link>
          <div className="mt-16 max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
              Road intelligence workspace
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-white">
              Smarter Roads.
              <br />
              Safer Journeys.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              Report hazards, inspect AI-assisted detections and monitor road
              conditions across Himachal Pradesh from one geospatial workspace.
            </p>
          </div>
        </div>
        <div className="relative grid gap-3">
          {[
            {
              icon: MapPinned,
              title: "Live hazard map",
              text: "Clustered reports on OpenStreetMap.",
            },
            {
              icon: ShieldCheck,
              title: "Verified workflow",
              text: "Reviewer actions with an audit trail.",
            },
            {
              icon: Waypoints,
              title: "Real data only",
              text: "No fabricated statistics or AI output.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-0.5 text-xs text-white/45">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 lg:hidden">
          <Link to="/" aria-label="RoadWatch HP home">
            <Logo />
          </Link>
          <Link to="/" className="text-sm font-medium text-muted hover:text-ink">
            Back to home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="hidden lg:block">
              <Link
                to="/"
                className="text-sm font-medium text-muted hover:text-ink"
              >
                ← Back to home
              </Link>
            </div>
            <h1 className="mt-0 text-2xl font-bold tracking-tight text-ink lg:mt-6">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
            <div className="mt-7">{children}</div>
            <div className="mt-6 text-sm text-muted">{footer}</div>
          </div>
        </div>
        <div className="px-5 py-4 text-center text-xs text-muted lg:hidden">
          RoadWatch HP · Smarter Roads. Safer Journeys.
        </div>
      </div>
    </div>
  );
}
