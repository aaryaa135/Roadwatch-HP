import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { AuthShell } from "../components/auth/AuthShell";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Form";
import { InlineError } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

interface LocationState {
  from?: string;
}

export function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as LocationState | null)?.from || "/app";

  useEffect(() => {
    document.title = "Sign in — RoadWatch HP";
  }, []);

  if (!loading && isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      toast.success("Signed in", `Welcome back, ${user.full_name.split(" ")[0]}.`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to sign in. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in to RoadWatch HP"
      subtitle="Access the hazard map, reporting workflow and monitoring workspace."
      footer={
        <span>
          New to RoadWatch HP?{" "}
          <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
            Create an account
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <InlineError>{error}</InlineError>}
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
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
        <Button
          type="submit"
          className="w-full"
          loading={submitting}
          icon={<LogIn className="h-4 w-4" />}
        >
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
