import type { Phrase, CreatePhraseRequest, UpdatePhraseRequest } from "../types/phrase";

type ListParams = {
  q?: string;
  category?: string;
};

const buildQuery = (params: ListParams) => {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category) sp.set("category", params.category);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
};

const handleJson = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
};

export const phrasesApi = {
  async list(params: ListParams = {}): Promise<Phrase[]> {
    const res = await fetch(`/api/phrases${buildQuery(params)}`);
    return handleJson<Phrase[]>(res);
  },

  async get(id: string): Promise<Phrase> {
    const res = await fetch(`/api/phrases/${encodeURIComponent(id)}`);
    return handleJson<Phrase>(res);
  },

  async create(payload: CreatePhraseRequest): Promise<Phrase> {
    const res = await fetch(`/api/phrases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleJson<Phrase>(res);
  },

  async update(id: string, payload: UpdatePhraseRequest): Promise<Phrase> {
    const res = await fetch(`/api/phrases/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleJson<Phrase>(res);
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/phrases/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
    }
  },
};