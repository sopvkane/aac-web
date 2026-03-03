import type { LoginRequest, LoginResponse, MeResponse } from "../types/auth";

const handleJson = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
};

export const authApi = {
  async me(): Promise<MeResponse> {
    const res = await fetch("/api/auth/me");
    return handleJson<MeResponse>(res);
  },

  async login(payload: LoginRequest): Promise<LoginResponse> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleJson<LoginResponse>(res);
  },

  async logout(): Promise<void> {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
    });
    if (!res.ok && res.status !== 401) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
    }
  },
};

