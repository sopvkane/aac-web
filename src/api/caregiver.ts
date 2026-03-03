import type { CaregiverDashboard } from "../types/caregiverDashboard";

const handleJson = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
};

export const caregiverApi = {
  async getDashboard(period?: string): Promise<CaregiverDashboard> {
    const qs = period ? `?period=${encodeURIComponent(period)}` : "";
    const res = await fetch(`/api/carer/dashboard${qs}`);
    return handleJson<CaregiverDashboard>(res);
  },
};

