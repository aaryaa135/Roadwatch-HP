import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { AuthShell } from "../components/auth/AuthShell";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Form";
import { InlineError } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { DISTRICTS } from "../utils/constants";

export function Register() {
  const { register, isAuthenticated, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    district: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Create account — RoadWatch HP";
  }, []);

  if (!loading && isAuthenticated) return <Navigate to="/app" replace />;

  const update = (field: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!form.full_name.trim()) return setError("Enter your full name.");
    if (!form.email.trim()) return setError("Enter your email address.");
    if (form.password.length < 8)
      return setError("Use a password with at least 8 characters.");
    if (form.password !== form.confirm)
      return setError("The two passwords do not match.");

    setSubmitting(true);
    try {
      const user = await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        district: form.district || undefined,
      });
      toast.success("Account created", `Welcome to RoadWatch HP, ${user.full_name.split(" ")[0]}.`);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create the account."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your RoadWatch HP account"
      subtitle="Report road hazards and help improve safety across Himachal Pradesh."
      footer={
        <span>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <InlineError>{error}</InlineError>}
        <Input
          label="Full name"
          required
          autoComplete="name"
          value={form.full_name}
          onChange={update("full_name")}
          placeholder="Your full name"
        />
        <Input
          label="Email address"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={update("email")}
          placeholder="you@example.com"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone (optional)"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={update("phone")}
            placeholder="+91…"
          />
          <Select
            label="District (optional)"
            value={form.district}
            onChange={update("district")}
          >
            <option value="">Select district</option>
            {DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </Select>
        </div>
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={form.password}
            onChange={update("password")}
            placeholder="At least 8 characters"
            hint="Use at least 8 characters."
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-[34px] rounded-md p-1.5 text-muted hover:bg-surface hover:text-ink"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Input
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="new-password"
          value={form.confirm}
          onChange={update("confirm")}
          placeholder="Repeat your password"
        />
        <Button
          type="submit"
          className="w-full"
          loading={submitting}
          icon={<UserPlus className="h-4 w-4" />}
        >
          Create account
        </Button>
        <p className="text-xs leading-relaxed text-muted">
          By creating an account you agree to submit accurate hazard reports.
          Administrative privileges are assigned separately by RoadWatch
          administrators.
        </p>
      </form>
    </AuthShell>
  );
}
