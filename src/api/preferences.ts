import type { PreferenceItem, PreferenceItemRequest, PreferenceKind } from "../types/preferences";

const handleJson = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
};

const serialiseTags = (tags?: string[]): string | undefined =>
  tags && tags.length ? tags.join(",") : undefined;

const parseTags = (raw: string | null): string[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
};

const normaliseItem = (raw: any): PreferenceItem => ({
  id: String(raw.id),
  kind: raw.kind,
  label: raw.label,
  category: raw.category ?? null,
  tags: parseTags(raw.tags ?? null),
  imageUrl: raw.imageUrl ?? null,
  scope: raw.scope as "HOME" | "SCHOOL" | "BOTH",
  priority: typeof raw.priority === "number" ? raw.priority : 0,
});

export const preferencesApi = {
  async list(kind: PreferenceKind): Promise<PreferenceItem[]> {
    const res = await fetch(`/api/carer/preferences?kind=${encodeURIComponent(kind)}`);
    const json = await handleJson<any[]>(res);
    return json.map(normaliseItem);
  },

  async create(body: PreferenceItemRequest): Promise<PreferenceItem> {
    const res = await fetch("/api/carer/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: body.kind,
        label: body.label,
        category: body.category ?? null,
        tags: serialiseTags(body.tags),
        imageUrl: body.imageUrl ?? null,
        scope: body.scope,
        priority: body.priority ?? 0,
      }),
    });
    const json = await handleJson<any>(res);
    return normaliseItem(json);
  },

  async update(id: string, body: PreferenceItemRequest): Promise<PreferenceItem> {
    const res = await fetch(`/api/carer/preferences/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: body.kind,
        label: body.label,
        category: body.category ?? null,
        tags: serialiseTags(body.tags),
        imageUrl: body.imageUrl ?? null,
        scope: body.scope,
        priority: body.priority ?? 0,
      }),
    });
    const json = await handleJson<any>(res);
    return normaliseItem(json);
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/carer/preferences/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
    }
  },
};

