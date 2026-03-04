import { useCallback, useEffect, useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { phrasesApi } from "../api/phrases";
import { preferencesApi } from "../api/preferences";
import { iconsApi } from "../api/icons";
import type { Phrase } from "../types/phrase";
import type { PreferenceItem, PreferenceKind } from "../types/preferences";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { useAuth } from "../auth/AuthContext";

type IconMappingItem =
  | { source: "phrase"; id: string; label: string; kind: string; iconUrl: string | null; category?: string }
  | { source: "preference"; id: string; label: string; kind: PreferenceKind; iconUrl: string | null };

function preferenceKindsForRole(role: string | undefined): PreferenceKind[] {
  if (!role) return [];
  if (role === "PARENT" || role === "CLINICIAN") {
    return ["FOOD", "DRINK", "ACTIVITY", "FAMILY_MEMBER", "SCHOOL_PEER", "TEACHER", "BUS_STAFF", "SUBJECT"];
  }
  if (role === "CARER") return ["FOOD", "DRINK", "ACTIVITY"];
  if (role === "SCHOOL_ADMIN" || role === "SCHOOL_TEACHER") {
    return ["SCHOOL_PEER", "TEACHER", "BUS_STAFF", "SUBJECT"];
  }
  return [];
}

const KIND_LABELS: Record<string, string> = {
  phrase: "Phrase",
  FOOD: "Food",
  DRINK: "Drink",
  ACTIVITY: "Activity",
  FAMILY_MEMBER: "Family",
  SCHOOL_PEER: "Classmate",
  TEACHER: "Teacher",
  BUS_STAFF: "Bus",
  SUBJECT: "Subject",
};

function IconPreview({ url, label, size = 40 }: { url: string | null; label: string; size?: number }) {
  if (url && (url.startsWith("http") || url.startsWith("/"))) {
    return (
      <img
        src={url}
        alt=""
        className="rounded-lg object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  if (url && url.startsWith("twemoji:")) {
    return (
      <span className="inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
        <Icon icon={url} width={size} height={size} />
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {label.charAt(0).toUpperCase() || "?"}
    </span>
  );
}

function ChangeIconModal({
  item,
  onSave,
  onClose,
  suggestions,
}: {
  item: IconMappingItem;
  onSave: (iconUrl: string | null) => Promise<void>;
  onClose: () => void;
  suggestions: Record<string, string>;
}) {
  const [value, setValue] = useState(item.iconUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestionEntries = useMemo(
    () =>
      Object.entries(suggestions).filter(
        ([label]) =>
          label.toLowerCase().includes(item.label.toLowerCase()) ||
          item.label.toLowerCase().includes(label.toLowerCase())
      ),
    [suggestions, item.label]
  );

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await onSave(value.trim() || null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      titleId="change-icon-title"
      className="max-w-md rounded-2xl border-2 border-indigo-100 p-6 shadow-xl"
    >
        <h3 id="change-icon-title" className="text-lg font-bold text-slate-800">
          Change icon for "{item.label}"
        </h3>
        <p className="mt-1 text-sm text-slate-500">{KIND_LABELS[item.kind] ?? item.kind}</p>

        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Icon URL or Iconify key
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. https://... or twemoji:droplet"
              className="mt-1 w-full aac-input px-3 py-2"
            />
          </label>

          {suggestionEntries.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Suggestions for "{item.label}"</p>
              <div className="flex flex-wrap gap-2">
                {suggestionEntries.slice(0, 8).map(([suggestLabel, path]) => {
                  const displayValue = path.startsWith("/") ? path : path.startsWith("http") ? path : `/${path}.svg`;
                  return (
                    <button
                      key={suggestLabel}
                      type="button"
                      onClick={() => setValue(displayValue)}
                      className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2 text-xs hover:bg-indigo-100"
                    >
                      <span className="text-lg" aria-hidden>🖼</span>
                      {suggestLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
    </Dialog>
  );
}

function EditPhraseModal({
  phrase,
  onSaved,
  onClose,
}: {
  phrase: { id: string; text: string; category: string; iconUrl: string | null };
  onSaved: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(phrase.text);
  const [category, setCategory] = useState(phrase.category);
  const [iconUrl, setIconUrl] = useState(phrase.iconUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await phrasesApi.update(phrase.id, {
        text: text.trim(),
        category: category.trim() || "general",
        iconUrl: iconUrl.trim() || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update phrase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      titleId="edit-phrase-title"
      className="max-w-md rounded-2xl border-2 border-indigo-100 p-6 shadow-xl"
    >
        <h3 id="edit-phrase-title" className="text-lg font-bold text-slate-800">
          Edit phrase
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Text
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1 w-full aac-input px-3 py-2"
              required
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Category
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full aac-input px-3 py-2"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Icon URL (optional)
            <input
              type="text"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="e.g. twemoji:droplet"
              className="mt-1 w-full aac-input px-3 py-2"
            />
          </label>
          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">
              {error}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
    </Dialog>
  );
}

function AddPhraseModal({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("general");
  const [iconUrl, setIconUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await phrasesApi.create({
        text: text.trim(),
        category: category.trim() || "general",
        iconUrl: iconUrl.trim() || null,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add phrase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      titleId="add-phrase-title"
      className="max-w-md rounded-2xl border-2 border-indigo-100 p-6 shadow-xl"
    >
        <h3 id="add-phrase-title" className="text-lg font-bold text-slate-800">
          Add phrase
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Text
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. I want water"
              className="mt-1 w-full aac-input px-3 py-2"
              required
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Category
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. general, wants"
              className="mt-1 w-full aac-input px-3 py-2"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Icon URL (optional)
            <input
              type="text"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="e.g. twemoji:droplet"
              className="mt-1 w-full aac-input px-3 py-2"
            />
          </label>
          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">
              {error}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !text.trim()}>
              {saving ? "Adding…" : "Add"}
            </Button>
          </div>
        </form>
    </Dialog>
  );
}

export function IconMappingSection() {
  const auth = useAuth();
  const [items, setItems] = useState<IconMappingItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [editingItem, setEditingItem] = useState<IconMappingItem | null>(null);
  const [editingPhrase, setEditingPhrase] = useState<IconMappingItem | null>(null);
  const [showAddPhrase, setShowAddPhrase] = useState(false);

  const canEdit =
    auth.role === "PARENT" ||
    auth.role === "CLINICIAN" ||
    auth.role === "CARER" ||
    auth.role === "SCHOOL_ADMIN" ||
    auth.role === "SCHOOL_TEACHER";

  const load = useCallback(async () => {
    if (auth.status !== "authenticated") return;
    setError(null);
    setLoading(true);
    try {
      const kinds = preferenceKindsForRole(auth.role ?? undefined);
      const [phrasesData, iconsData, ...prefArrays] = await Promise.all([
        phrasesApi.list({}),
        iconsApi.getSuggestions(),
        ...kinds.map((k) => preferencesApi.list(k)),
      ]);

      const phraseItems: IconMappingItem[] = (phrasesData as Phrase[]).map((p) => ({
        source: "phrase",
        id: p.id,
        label: p.text,
        kind: "phrase",
        iconUrl: (p as Phrase & { iconUrl?: string | null }).iconUrl ?? null,
        category: p.category,
      }));

      const prefItems: IconMappingItem[] = (prefArrays as PreferenceItem[][]).flatMap((arr) =>
        arr.map((p) => ({
          source: "preference" as const,
          id: p.id,
          label: p.label,
          kind: p.kind,
          iconUrl: p.imageUrl,
        }))
      );

      setItems([...phraseItems, ...prefItems]);
      setSuggestions(iconsData.suggestions ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [auth.status, auth.role]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, search]);

  const handleSaveIcon = async (item: IconMappingItem, iconUrl: string | null) => {
    if (item.source === "phrase") {
      const p = await phrasesApi.get(item.id);
      await phrasesApi.update(item.id, {
        text: p.text,
        category: p.category,
        iconUrl,
      });
    } else {
      const prefs = await preferencesApi.list(item.kind);
      const found = prefs.find((x) => x.id === item.id);
      if (found) {
        await preferencesApi.update(item.id, {
          kind: found.kind,
          label: found.label,
          scope: found.scope,
          category: found.category,
          tags: found.tags,
          imageUrl: iconUrl,
        });
      }
    }
    await load();
  };

  if (auth.status !== "authenticated") {
    return null;
  }

  return (
    <div className="aac-panel rounded-[28px] border-2 border-indigo-100 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-[var(--shadow)] space-y-5">
      <header>
        <h2 className="text-lg font-bold text-slate-800">Icon mapping</h2>
        <p className="text-sm text-slate-600 mt-1">
          Search and change icons for phrases, foods, drinks, activities, and people. Used across the app for clearer
          communication.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            width={20}
            height={20}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by label…"
            className="w-full aac-input pl-10 pr-4 py-2.5"
            aria-label="Search icon mappings"
          />
        </div>
        {canEdit && (
          <Button type="button" size="sm" onClick={() => setShowAddPhrase(true)}>
            Add phrase
          </Button>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div
          className="max-h-[480px] overflow-y-auto overscroll-contain rounded-2xl border border-indigo-100 bg-slate-50/50 pr-1"
          role="list"
        >
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 text-center">
              {search.trim() ? "No matches." : "No phrases or preference items yet. Add a phrase to get started."}
            </p>
          ) : (
            <div className="divide-y divide-slate-200/80">
              {filtered.map((item) => (
                <div
                  key={`${item.source}-${item.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/60 transition-colors"
                >
                  <IconPreview url={item.iconUrl} label={item.label} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.label}</p>
                    <p className="text-xs text-slate-500">{KIND_LABELS[item.kind] ?? item.kind}</p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 shrink-0">
                      {item.source === "phrase" && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPhrase(item)}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!window.confirm(`Delete phrase "${item.label}"?`)) return;
                              try {
                                await phrasesApi.remove(item.id);
                                await load();
                              } catch (err) {
                                setError(err instanceof Error ? err.message : "Failed to delete");
                              }
                            }}
                            className="text-xs text-rose-600 hover:text-rose-700"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                        className="text-xs"
                      >
                        Change icon
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editingItem && (
        <ChangeIconModal
          item={editingItem}
          suggestions={suggestions}
          onSave={(url) => handleSaveIcon(editingItem, url)}
          onClose={() => setEditingItem(null)}
        />
      )}

      {showAddPhrase && (
        <AddPhraseModal onCreated={() => void load()} onClose={() => setShowAddPhrase(false)} />
      )}

      {editingPhrase && editingPhrase.source === "phrase" && "category" in editingPhrase && (
        <EditPhraseModal
          phrase={{
            id: editingPhrase.id,
            text: editingPhrase.label,
            category: editingPhrase.category ?? "general",
            iconUrl: editingPhrase.iconUrl,
          }}
          onSaved={() => void load()}
          onClose={() => setEditingPhrase(null)}
        />
      )}
    </div>
  );
}
