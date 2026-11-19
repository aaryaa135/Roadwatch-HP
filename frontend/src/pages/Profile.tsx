import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock3,
  KeyRound,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { StatCard } from "../components/dashboard/StatCard";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Form";
import { LinkButton } from "../components/ui/LinkButton";
import { InlineError } from "../components/ui/States";
import { ReportTable } from "../components/reports/ReportTable";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useAsyncData } from "../hooks/useAsyncData";
import {
  changePassword,
  getReports,
  updateProfile,
} from "../services/api";
import { DISTRICTS } from "../utils/constants";
import { formatDate, initials } from "../utils/format";

export function Profile() {
  const { user, setUser, isAdmin } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    district: "",
  });
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [password, setPassword] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const reportsQuery = useAsyncData(
    () =>
      user
        ? getReports({ reporter_id: user.id, limit: 500, sort_by: "created_at", sort_dir: "desc" })
        : Promise.resolve([]),
    [user?.id]
  );

  useEffect(() => {
    if (!user) return;
    setProfile({
      full_name: user.full_name,
      phone: user.phone ?? "",
      district: user.district ?? "",
    });
  }, [user]);

  if (!user) {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="Account" title="Profile" />
        <Card>
          <CardBody className="py-12 text-center text-sm text-muted">
            Your profile is not available. Try signing in again.
          </CardBody>
        </Card>
      </div>
    );
  }

  const reports = reportsQuery.data ?? [];
  const verified = reports.filter((report) => report.status === "verified").length;
  const pending = reports.filter((report) => report.status === "pending").length;
  const highSeverity = reports.filter(
    (report) => report.severity === "high" || report.severity === "critical"
  ).length;

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError("");
    if (!profile.full_name.trim()) {
      setProfileError("Enter your full name.");
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await updateProfile({
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim() || undefined,
        district: profile.district || undefined,
      });
      setUser(updated);
      toast.success("Profile updated");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Unable to update your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    if (!password.current) {
      setPasswordError("Enter your current password.");
      return;
    }
    if (password.next.length < 8) {
      setPasswordError("Use a new password with at least 8 characters.");
      return;
    }
    if (password.next !== password.confirm) {
      setPasswordError("The new passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({
        current_password: password.current,
        new_password: password.next,
      });
      setPassword({ current: "", next: "", confirm: "" });
      toast.success("Password changed");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Unable to change your password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="Manage your RoadWatch HP account details and review the reports you have submitted."
        actions={
          isAdmin ? (
            <LinkButton to="/app/verification" variant="outline" icon={<ShieldCheck className="h-4 w-4" />}>
              Verification queue
            </LinkButton>
          ) : (
            <LinkButton to="/app/report" icon={<ClipboardList className="h-4 w-4" />}>
              Report hazard
            </LinkButton>
          )
        }
      />

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-700 text-xl font-semibold text-white">
                  {initials(user.full_name)}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-ink">
                    {user.full_name}
                  </h2>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded border border-line bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                    {user.role === "admin" ? (
                      <ShieldCheck className="h-3 w-3" />
                    ) : (
                      <UserRound className="h-3 w-3" />
                    )}
                    {user.role}
                  </span>
                </div>
              </div>
              <dl className="mt-5 space-y-3 border-t border-line pt-4 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-muted">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </dt>
                  <dd className="max-w-[190px] truncate font-medium text-ink">
                    {user.email}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    District
                  </dt>
                  <dd className="font-medium text-ink">
                    {user.district ?? "Not set"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-muted">
                    <Calendar className="h-3.5 w-3.5" />
                    Member since
                  </dt>
                  <dd className="font-medium text-ink">
                    {formatDate(user.created_at)}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="My reports"
              value={reports.length}
              icon={ClipboardList}
              tone="brand"
              loading={reportsQuery.loading}
            />
            <StatCard
              label="Verified"
              value={verified}
              icon={CheckCircle2}
              tone="sky"
              loading={reportsQuery.loading}
            />
            <StatCard
              label="Pending"
              value={pending}
              icon={Clock3}
              tone="amber"
              loading={reportsQuery.loading}
            />
            <StatCard
              label="High severity"
              value={highSeverity}
              icon={ShieldCheck}
              tone="red"
              loading={reportsQuery.loading}
            />
          </div>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Edit profile"
              description="Update your contact details and home district."
            />
            <CardBody>
              <form onSubmit={saveProfile} className="space-y-4" noValidate>
                {profileError && <InlineError>{profileError}</InlineError>}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Full name"
                    required
                    value={profile.full_name}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        full_name: event.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Email"
                    value={user.email}
                    disabled
                    hint="Email changes are not supported yet."
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="+91…"
                  />
                  <Select
                    label="District"
                    value={profile.district}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        district: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select district</option>
                    {DISTRICTS.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={savingProfile}
                    icon={<Save className="h-4 w-4" />}
                  >
                    Save changes
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Change password"
              description="Use at least 8 characters. You will stay signed in on this device."
            />
            <CardBody>
              <form onSubmit={savePassword} className="space-y-4" noValidate>
                {passwordError && <InlineError>{passwordError}</InlineError>}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    label="Current password"
                    type="password"
                    autoComplete="current-password"
                    value={password.current}
                    onChange={(event) =>
                      setPassword((current) => ({
                        ...current,
                        current: event.target.value,
                      }))
                    }
                  />
                  <Input
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    value={password.next}
                    onChange={(event) =>
                      setPassword((current) => ({
                        ...current,
                        next: event.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Confirm new password"
                    type="password"
                    autoComplete="new-password"
                    value={password.confirm}
                    onChange={(event) =>
                      setPassword((current) => ({
                        ...current,
                        confirm: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted">
                    Need account settings?{" "}
                    <Link to="/app/settings" className="font-semibold text-brand-700">
                      Open settings
                    </Link>
                  </p>
                  <Button
                    type="submit"
                    variant="outline"
                    loading={savingPassword}
                    icon={<KeyRound className="h-4 w-4" />}
                  >
                    Update password
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="My recent reports"
              description="Reports you have submitted to RoadWatch HP."
              action={
                <Link
                  to="/app/reports"
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                >
                  View all reports
                </Link>
              }
            />
            <ReportTable
              reports={reports.slice(0, 8)}
              loading={reportsQuery.loading}
              error={reportsQuery.error}
              onRetry={reportsQuery.reload}
              emptyTitle="You have not submitted any reports"
              emptyDescription="When you report a hazard, it will appear here with its verification status."
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
