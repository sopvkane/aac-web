import type { UpdateUserProfileRequest, UserProfile } from "../types/profile";

const handleJson = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
};

export const profileApi = {
  async get(): Promise<UserProfile> {
    const res = await fetch("/api/carer/profile", { credentials: "include" });
    return handleJson<UserProfile>(res);
  },

  async update(body: UpdateUserProfileRequest): Promise<UserProfile> {
    const res = await fetch("/api/carer/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });
    return handleJson<UserProfile>(res);
  },
};

