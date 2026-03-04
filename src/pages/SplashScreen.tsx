import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/button";
import { cn } from "../lib/cn";

export function SplashScreen() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "pin">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    auth.clearError();
    try {
      await auth.loginWithEmail(email, password);
      setPassword("");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handlePinSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    auth.clearError();
    try {
      await auth.loginWithPin(pin);
      setPin("");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Invalid PIN");
    }
  };

  const handleContinueAsGuest = () => {
    auth.continueAsGuest();
  };

  const effectiveError = localError ?? auth.error;

  if (showRegister) {
    return (
      <RegistrationPage
        onBack={() => setShowRegister(false)}
        onSuccess={() => setShowRegister(false)}
      />
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-indigo-900 sm:text-4xl">
            Sophie AAC
          </h1>
          <p className="text-lg text-slate-600">
            Augmentative and alternative communication
          </p>
        </div>

        <div className="rounded-[28px] border-2 border-indigo-100 bg-white/90 p-6 shadow-lg sm:p-8">
          <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "pin")}>
            <Tabs.List className="mb-6 flex gap-2 rounded-xl bg-indigo-50 p-1 border border-indigo-100">
              <Tabs.Trigger
                value="signin"
                className={cn(
                  "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition",
                  "data-[state=active]:bg-indigo-600 data-[state=active]:text-white",
                  "data-[state=inactive]:text-slate-700 hover:bg-indigo-100"
                )}
              >
                Sign in
              </Tabs.Trigger>
              <Tabs.Trigger
                value="pin"
                className={cn(
                  "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition",
                  "data-[state=active]:bg-indigo-600 data-[state=active]:text-white",
                  "data-[state=inactive]:text-slate-700 hover:bg-indigo-100"
                )}
              >
                Quick access (PIN)
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="signin">
              <h2 className="mb-4 text-lg font-bold text-slate-800">Sign in with your account</h2>
              <form onSubmit={handleSignIn} className="space-y-4 text-left">
                <div className="space-y-2">
                  <label htmlFor="splash-signin-email" className="block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    id="splash-signin-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    placeholder="you@example.com"
                    aria-label="Email"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="splash-signin-password" className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <input
                    id="splash-signin-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    placeholder="••••••••"
                    aria-label="Password"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={auth.loading || !email.trim() || !password}
                  className="w-full"
                >
                  {auth.loading ? "Signing in…" : "Sign in"}
                </Button>
                <p className="text-center text-sm text-slate-600">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    className="font-semibold text-indigo-600 hover:text-indigo-700 underline"
                    onClick={() => setShowRegister(true)}
                  >
                    Create account
                  </button>
                </p>
              </form>
            </Tabs.Content>

            <Tabs.Content value="pin">
              <h2 className="mb-4 text-lg font-bold text-slate-800">Quick access with PIN</h2>
              <p className="mb-4 text-sm text-slate-600 text-left">
                Enter the PIN shared with you for this device (e.g. by a parent or clinician).
              </p>
              <form onSubmit={handlePinSignIn} className="space-y-4 text-left">
                <div className="space-y-2">
                  <label htmlFor="splash-signin-pin" className="block text-sm font-semibold text-slate-700">
                    PIN
                  </label>
                  <input
                    id="splash-signin-pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    placeholder="Enter PIN"
                    aria-label="Enter PIN"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={auth.loading || !pin.trim()}
                  className="w-full"
                >
                  {auth.loading ? "Signing in…" : "Continue"}
                </Button>
              </form>
            </Tabs.Content>
          </Tabs.Root>

          {effectiveError && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            >
              {effectiveError}
            </div>
          )}

          <div className="mt-6 border-t border-indigo-100 pt-6">
            <p className="mb-3 text-sm text-slate-600">
              No saved preferences • Read-only
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleContinueAsGuest}
              className="w-full"
            >
              Continue as guest
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegistrationPage({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const auth = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"PARENT_CARER" | "CLINICIAN">("PARENT_CARER");
  const [joiningCode, setJoiningCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!displayName.trim()) errs.push("Name is required");
    if (!email.trim()) errs.push("Email is required");
    if (!password) errs.push("Password is required");
    else {
      if (password.length < 10) errs.push("Password must be at least 10 characters");
      if (!/[A-Z]/.test(password)) errs.push("Password must contain an uppercase letter");
      if (!/[a-z]/.test(password)) errs.push("Password must contain a lowercase letter");
      if (!/\d/.test(password)) errs.push("Password must contain a number");
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errs.push("Password must contain a symbol");
    }
    if (password !== confirmPassword) errs.push("Passwords do not match");
    if (!joiningCode.trim()) errs.push("Joining code is required");
    return errs;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    auth.clearError();
    const errs = validate();
    if (errs.length > 0) {
      setValidationErrors(errs);
      return;
    }
    setValidationErrors([]);
    try {
      await auth.register({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        role,
        joiningCode: joiningCode.trim(),
      });
      onSuccess();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  const effectiveError = localError ?? auth.error;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-indigo-900 sm:text-3xl">
            Create account
          </h1>
          <p className="text-slate-600">
            Get a joining code from your clinician to register.
          </p>
        </div>

        <div className="rounded-[28px] border-2 border-indigo-100 bg-white/90 p-6 shadow-lg sm:p-8">
          <form onSubmit={handleRegister} className="space-y-4 text-left">
            <div className="space-y-2">
              <label htmlFor="register-display-name" className="block text-sm font-semibold text-slate-700">
                Display name
              </label>
              <input
                id="register-display-name"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                placeholder="Your name"
                aria-label="Display name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="register-email" className="block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                placeholder="you@example.com"
                aria-label="Email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="register-password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                placeholder="Min 10 chars, upper, lower, number, symbol"
                aria-label="Password"
              />
              <p className="text-xs text-slate-500">
                At least 10 characters, including uppercase, lowercase, number, and symbol
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="register-confirm-password" className="block text-sm font-semibold text-slate-700">
                Confirm password
              </label>
              <input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                placeholder="Confirm password"
                aria-label="Confirm password"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="register-role" className="block text-sm font-semibold text-slate-700">
                Role
              </label>
              <select
                id="register-role"
                value={role}
                onChange={(e) => setRole(e.target.value as "PARENT_CARER" | "CLINICIAN")}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label="Role"
              >
                <option value="PARENT_CARER">Parent / Carer</option>
                <option value="CLINICIAN">Clinician</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="register-joining-code" className="block text-sm font-semibold text-slate-700">
                Joining code
              </label>
              <input
                id="register-joining-code"
                type="text"
                value={joiningCode}
                onChange={(e) => setJoiningCode(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                placeholder="From your clinician"
                aria-label="Joining code"
              />
              <p className="text-xs text-slate-500">
                Demo: DEMO2024
              </p>
            </div>

            {(validationErrors.length > 0 || effectiveError) && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 space-y-1"
              >
                {validationErrors.map((e) => (
                  <p key={e}>• {e}</p>
                ))}
                {effectiveError && !validationErrors.includes(effectiveError) && (
                  <p>• {effectiveError}</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                Back
              </Button>
              <Button type="submit" disabled={auth.loading} className="flex-1">
                {auth.loading ? "Creating account…" : "Create account"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
