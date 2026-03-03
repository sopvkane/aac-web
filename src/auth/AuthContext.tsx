import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role } from "../types/auth";

type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  role: Role | null;
  loading: boolean;
  error: string | null;
  login: (role: Role, pin: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("unauthenticated");
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For the assessed prototype, start unauthenticated and
    // let the local PIN check drive auth state.
    setStatus("unauthenticated");
    setRole(null);
    setLoading(false);
  }, []);

  const login = async (roleValue: Role, pin: string) => {
    setError(null);
    setLoading(true);
    try {
      // Frontend-only PIN check using the same demo pins
      // as the backend seeder: 1234/2345/3456.
      const expectedPins: Record<Role, string> = {
        PARENT: "1234",
        CARER: "2345",
        CLINICIAN: "3456",
      };

      if (expectedPins[roleValue] !== pin.trim()) {
        throw new Error("Invalid PIN for selected role");
      }

      setStatus("authenticated");
      setRole(roleValue);
    } catch (err) {
      setStatus("unauthenticated");
      setRole(null);
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    setLoading(true);
    try {
      // Nothing to do for local auth beyond clearing state.
      setStatus("unauthenticated");
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        role,
        loading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

