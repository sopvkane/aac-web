import { useEffect, useMemo, useState } from "react";
import { phrasesApi } from "../api/phrases";
import type { Phrase } from "../types/phrase";
import { PhraseForm } from "../components/PhraseForm";
import { PhraseList } from "../components/PhraseList";

export function PhrasesPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);

  const filters = useMemo(
    () => ({ q: q.trim() || undefined, category: category.trim() || undefined }),
    [q, category]
  );

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
  };

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await phrasesApi.list(filters);
      setPhrases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load phrases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.category]);

  const startEdit = async (id: string) => {
    setError(null);
    setEditingId(id);
    setEditingPhrase(null);

    try {
      const p = await phrasesApi.get(id);
      setEditingPhrase(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load phrase");
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingPhrase(null);
  };

  const createPhrase = async (values: { text: string; category: string }) => {
    await phrasesApi.create(values);
    showNotice("Phrase created");
    await load();
  };

  const updatePhrase = async (values: { text: string; category: string }) => {
    if (!editingId) return;
    await phrasesApi.update(editingId, values);
    showNotice("Phrase updated");
    cancelEdit();
    await load();
  };

  const deletePhrase = async (id: string) => {
    const p = phrases.find((x) => x.id === id);
    const ok = window.confirm(`Delete phrase "${p?.text ?? id}"?`);
    if (!ok) return;

    try {
      await phrasesApi.remove(id);
      showNotice("Phrase deleted");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete phrase");
    }
  };

  return (
    <main style={{ padding: 24, display: "grid", gap: 24 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <h1>Phrases</h1>
        <p style={{ opacity: 0.8 }}>
          CRUD + filtering wired to the Spring Boot API (AAC-08).
        </p>

        {notice && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: "10px 12px",
              border: "1px solid #cfe8cf",
              background: "#f1fff1",
              borderRadius: 8,
              maxWidth: 520,
            }}
          >
            {notice}
          </div>
        )}
      </header>

      <section style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <h2>Filters</h2>
        <div style={{ display: "grid", gap: 8 }}>
          <label>
            Search (q)
            <input value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
          </label>

          <label>
            Category
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>

          <button type="button" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2>{editingId ? "Edit phrase" : "Create phrase"}</h2>

        {editingId ? (
          editingPhrase ? (
            <PhraseForm
              initialText={editingPhrase.text}
              initialCategory={editingPhrase.category}
              submitLabel="Save changes"
              onSubmit={updatePhrase}
              onCancel={cancelEdit}
              clearOnSuccess={false}
            />
          ) : (
            <p>Loading phrase…</p>
          )
        ) : (
          <PhraseForm
            submitLabel="Create"
            onSubmit={createPhrase}
            clearOnSuccess={true}
          />
        )}
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2>Results</h2>

        {error && (
          <div role="alert" style={{ color: "crimson", maxWidth: 720 }}>
            {error}
          </div>
        )}

        {loading ? (
          <p>Loading…</p>
        ) : (
          <PhraseList phrases={phrases} onEdit={startEdit} onDelete={deletePhrase} />
        )}
      </section>
    </main>
  );
}