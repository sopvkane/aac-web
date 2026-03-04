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

type RawPreferenceItem = {
  id?: unknown;
  kind?: unknown;
  label?: unknown;
  category?: unknown;
  tags?: unknown;
  imageUrl?: unknown;
  scope?: unknown;
  priority?: unknown;
};

const normaliseItem = (raw: RawPreferenceItem): PreferenceItem => ({
  id: String(raw.id),
  kind: raw.kind as PreferenceItem["kind"],
  label: String(raw.label ?? ""),
  category: raw.category != null ? String(raw.category) : null,
  tags: parseTags(typeof raw.tags === "string" ? raw.tags : null),
  imageUrl: raw.imageUrl != null ? String(raw.imageUrl) : null,
  scope: (raw.scope as PreferenceItem["scope"]) ?? "HOME",
  priority: typeof raw.priority === "number" ? raw.priority : 0,
});

export const preferencesApi = {
  /** Who-to-ask people for Speak tab, filtered by location (HOME | SCHOOL | BUS). Use for person picker. */
  async whoToAsk(location: "HOME" | "SCHOOL" | "BUS"): Promise<PreferenceItem[]> {
    const res = await fetch(`/api/carer/preferences/who-to-ask?location=${encodeURIComponent(location)}`, {
      credentials: "include",
    });
    const json = await handleJson<RawPreferenceItem[]>(res);
    return json.map(normaliseItem);
  },

  async list(kind: PreferenceKind): Promise<PreferenceItem[]> {
    const res = await fetch(`/api/carer/preferences?kind=${encodeURIComponent(kind)}`, {
      credentials: "include",
    });
    const json = await handleJson<RawPreferenceItem[]>(res);
    return json.map(normaliseItem);
  },

  async create(body: PreferenceItemRequest): Promise<PreferenceItem> {
    const res = await fetch("/api/carer/preferences", {
      method: "POST",
      credentials: "include",
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
    const json = await handleJson<RawPreferenceItem>(res);
    return normaliseItem(json);
  },

  async update(id: string, body: PreferenceItemRequest): Promise<PreferenceItem> {
    const res = await fetch(`/api/carer/preferences/${encodeURIComponent(id)}`, {
      method: "PUT",
      credentials: "include",
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
    const json = await handleJson<RawPreferenceItem>(res);
    return normaliseItem(json);
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/carer/preferences/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
    }
  },
};

