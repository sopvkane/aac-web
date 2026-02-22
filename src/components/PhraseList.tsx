import type { Phrase } from "../types/phrase";

type Props = {
  phrases: Phrase[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
};

export function PhraseList({ phrases, onEdit, onDelete }: Props) {
  if (phrases.length === 0) return <p>No phrases found.</p>;

  return (
    <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
      {phrases.map((p) => (
        <li key={p.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <strong>{p.text}</strong>
              <div style={{ opacity: 0.8 }}>Category: {p.category}</div>
              <div style={{ opacity: 0.6, fontSize: 12 }}>ID: {p.id}</div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
              <button type="button" onClick={() => onEdit(p.id)}>
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(p.id)}
                aria-label={`Delete phrase ${p.text}`}
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}