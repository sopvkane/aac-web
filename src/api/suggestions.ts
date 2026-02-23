import type { SuggestionsRequest, SuggestionsResponse } from "../types/suggestions";

const handleJson = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
};

export const suggestionsApi = {
  async suggest(payload: SuggestionsRequest): Promise<SuggestionsResponse> {
    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleJson<SuggestionsResponse>(res);
  },
};