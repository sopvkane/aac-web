import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi } from "../api/auth";
import type { Role } from "../types/auth";
import type { ProfileSummary } from "../types/auth";

type AuthStatus = "unknown" | "authenticated" | "unauthenticated" | "guest";

type AuthState = {
  status: AuthStatus;
  role: Role | null;
  activeProfileId: string | null;
  profiles: ProfileSummary[];
  loading: boolean;
  error: string | null;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithPin: (pin: string) => Promise<void>;
  register: (payload: {
    displayName: string;
    email: string;
    password: string;
    role: "PARENT_CARER" | "CLINICIAN";
    joiningCode: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  setToUnauthenticated: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("unknown");
  const [role, setRole] = useState<Role | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyAuthResponse = useCallback(
    (res: { role: Role; activeProfileId: string | null; profiles: ProfileSummary[] }) => {
      setStatus("authenticated");
      setRole(res.role);
      setActiveProfileId(res.activeProfileId);
      setProfiles(res.profiles ?? []);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        const me = await authApi.me();
        if (!cancelled) {
          applyAuthResponse(me);
        }
      } catch {
        if (!cancelled) {
          setStatus("unauthenticated");
          setRole(null);
          setActiveProfileId(null);
          setProfiles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void restore();
    return () => {
      cancelled = true;
    };
  }, [applyAuthResponse]);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setLoading(true);
      try {
        const res = await authApi.login({ email: email.trim(), password });
        applyAuthResponse(res);
      } catch (err) {
        setStatus("unauthenticated");
        setRole(null);
        setActiveProfileId(null);
        setProfiles([]);
        const msg = err instanceof Error ? err.message : "Login failed";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [applyAuthResponse]
  );

  const loginWithPin = useCallback(
    async (pin: string) => {
      setError(null);
      setLoading(true);
      try {
        const res = await authApi.login({ pin: pin.trim() });
        applyAuthResponse(res);
      } catch (err) {
        setStatus("unauthenticated");
        setRole(null);
        setActiveProfileId(null);
        setProfiles([]);
        const msg = err instanceof Error ? err.message : "Invalid PIN";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [applyAuthResponse]
  );

  const register = useCallback(
    async (payload: {
      displayName: string;
      email: string;
      password: string;
      role: "PARENT_CARER" | "CLINICIAN";
      joiningCode: string;
    }) => {
      setError(null);
      setLoading(true);
      try {
        const res = await authApi.register(payload);
        applyAuthResponse(res);
      } catch (err) {
        setStatus("unauthenticated");
        setRole(null);
        setActiveProfileId(null);
        setProfiles([]);
        const msg = err instanceof Error ? err.message : "Registration failed";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [applyAuthResponse]
  );

  const logout = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors; clear state anyway
    } finally {
      setStatus("unauthenticated");
      setRole(null);
      setActiveProfileId(null);
      setProfiles([]);
      setLoading(false);
    }
  }, []);

  const continueAsGuest = useCallback(() => {
    setStatus("guest");
    setRole(null);
    setActiveProfileId(null);
    setProfiles([]);
    setError(null);
  }, []);

  const setToUnauthenticated = useCallback(() => {
    setStatus("unauthenticated");
    setRole(null);
    setActiveProfileId(null);
    setProfiles([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        status,
        role,
        activeProfileId,
        profiles,
        loading,
        error,
        loginWithEmail,
        loginWithPin,
        register,
        logout,
        continueAsGuest,
        setToUnauthenticated,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- useAuth is a hook, not a component
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

