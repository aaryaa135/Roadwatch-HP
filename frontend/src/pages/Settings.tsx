import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Database,
  Download,
  Info,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
  Trash2,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { LinkButton } from "../components/ui/LinkButton";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { getHealth, getReports } from "../services/api";
import { cn } from "../utils/format";

const PREF_KEY = "roadwatch.preferences";

interface Preferences {
  emailUpdates: boolean;
  verificationAlerts: boolean;
  nearbyAlerts: boolean;
}

const defaultPreferences: Preferences = {
  emailUpdates: true,
  verificationAlerts: true,
  nearbyAlerts: false,
};

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return defaultPreferences;
    return { ...defaultPreferences, ...(JSON.parse(raw) as Partial<Preferences>) };
  } catch {
    return defaultPreferences;
  }
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-brand-700" : "bg-line"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function Settings() {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);
  const [exporting, setExporting] = useState(false);
  const healthQuery = useAsyncData(getHealth, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(preferences));
    } catch {
      // Preferences remain in memory if storage is unavailable.
    }
  }, [preferences]);

  const updatePreference = (key: keyof Preferences, value: boolean) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  const exportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const reports = await getReports({ reporter_id: user.id, limit: 500 });
      const payload = {
        exported_at: new Date().toISOString(),
        account: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          district: user.district,
          role: user.role,
          created_at: user.created_at,
        },
        reports,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `roadwatch-account-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Export ready", "Your account data was downloaded.");
    } catch (err) {
      toast.error(
        "Export failed",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setExporting(false);
    }
  };

  const clearPreferences = () => {
    try {
      localStorage.removeItem(PREF_KEY);
    } catch {
      // Ignore storage errors.
    }
    setPreferences(defaultPreferences);
    toast.success("Local preferences cleared");
  };

  const signOut = () => {
    logout();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  const health = healthQuery.data;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage account preferences, local data controls, and session options for RoadWatch HP."
        actions={
          <LinkButton to="/app/profile" variant="outline" icon={<UserRound className="h-4 w-4" />}>
            Edit profile
          </LinkButton>
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Account"
            description="Your identity and role on RoadWatch HP."
          />
          <CardBody className="space-y-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted">
                <UserRound className="h-3.5 w-3.5" />
                Name
              </span>
              <span className="font-medium text-ink">{user?.full_name ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted">
                <Mail className="h-3.5 w-3.5" />
                Email
              </span>
              <span className="max-w-[240px] truncate font-medium text-ink">
                {user?.email ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted">
                <MapPin className="h-3.5 w-3.5" />
                District
              </span>
              <span className="font-medium text-ink">{user?.district ?? "Not set"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted">
                <ShieldCheck className="h-3.5 w-3.5" />
                Role
              </span>
              <span className="font-medium capitalize text-ink">
                {user?.role ?? "—"}
              </span>
            </div>
            {isAdmin && (
              <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-[11px] leading-relaxed text-brand-800">
                Administrator access is enabled. Verification actions are
                available in the verification queue and on report details.
              </div>
            )}
            <div className="flex flex-wrap gap-2 border-t border-line pt-3">
              <Link
                to="/app/profile"
                className="text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                Edit profile details
              </Link>
              <span className="text-muted">·</span>
              <Link
                to="/app/profile"
                className="text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                Change password
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Notifications"
            description="Choose which updates you would like to receive."
            action={
              <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                <Bell className="h-3.5 w-3.5" />
                Local preferences
              </span>
            }
          />
          <CardBody className="space-y-4">
            {[
              {
                key: "emailUpdates" as const,
                title: "Email updates",
                description: "Account and platform announcements.",
              },
              {
                key: "verificationAlerts" as const,
                title: "Verification decisions",
                description: "When a report you submitted is verified, rejected, or resolved.",
              },
              {
                key: "nearbyAlerts" as const,
                title: "Nearby hazards",
                description: "New hazards reported close to your home district.",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-start justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    {item.description}
                  </p>
                </div>
                <Toggle
                  checked={preferences[item.key]}
                  onChange={(value) => updatePreference(item.key, value)}
                  label={item.title}
                />
              </div>
            ))}
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              These preferences are saved on this device. Server-side
              notification delivery is not connected in this build.
            </div>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearPreferences}
                icon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Reset preferences
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Data and privacy"
            description="Control the data associated with this account."
          />
          <CardBody className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-line bg-surface/50 p-3">
              <Database className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">Export account data</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  Download your profile and the reports you submitted as JSON.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={exportData}
                  loading={exporting}
                  icon={<Download className="h-3.5 w-3.5" />}
                >
                  Download my data
                </Button>
              </div>
            </div>
            <div className="text-[11px] leading-relaxed text-muted">
              Hazard reports are public by design so road users can see risks.
              Avoid including personal information in report titles,
              descriptions, or photographs.
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Session and system"
            description="Connection status and sign-out controls."
          />
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface/50 p-3">
              <div>
                <p className="text-xs font-semibold text-ink">API connection</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {healthQuery.loading
                    ? "Checking the RoadWatch server…"
                    : health?.status === "ok"
                      ? `${health.service} is reachable`
                      : "The server could not be reached"}
                </p>
              </div>
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  health?.status === "ok"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                )}
              >
                {health?.status === "ok" ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <div>
                <p className="text-xs font-semibold text-ink">Sign out</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  End this session on the current device.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={signOut}
                icon={<LogOut className="h-4 w-4" />}
              >
                Sign out
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
