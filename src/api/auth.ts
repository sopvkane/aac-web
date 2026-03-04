import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
} from "../types/auth";

const handleJson = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `${res.status} ${res.statusText}`;
    try {
      const json = JSON.parse(text) as { detail?: string };
      if (typeof json.detail === "string") {
        message = json.detail;
      } else if (text) {
        message += ` - ${text}`;
      }
    } catch {
      if (text) message += ` - ${text}`;
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
};

export const authApi = {
  async me(): Promise<MeResponse> {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    return handleJson<MeResponse>(res);
  },

  async login(payload: LoginRequest): Promise<LoginResponse> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return handleJson<LoginResponse>(res);
  },

  async register(payload: RegisterRequest): Promise<LoginResponse> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return handleJson<LoginResponse>(res);
  },

  async selectProfile(profileId: string): Promise<MeResponse> {
    const res = await fetch("/api/auth/select-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
      credentials: "include",
    });
    return handleJson<MeResponse>(res);
  },

  async logout(): Promise<void> {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok && res.status !== 401) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
    }
  },
};

