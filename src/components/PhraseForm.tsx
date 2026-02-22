import { useEffect, useState } from "react";

type Props = {
  initialText?: string;
  initialCategory?: string;
  submitLabel: string;
  onSubmit: (values: { text: string; category: string }) => Promise<void>;
  onCancel?: () => void;

  /**
   * If true, clears the form after a successful submit.
   * Use this for "Create" mode; keep false for edit mode.
   */
  clearOnSuccess?: boolean;
};

export function PhraseForm({
  initialText = "",
  initialCategory = "",
  submitLabel,
  onSubmit,
  onCancel,
  clearOnSuccess = false,
}: Props) {
  const [text, setText] = useState(initialText);
  const [category, setCategory] = useState(initialCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(initialText);
    setCategory(initialCategory);
  }, [initialText, initialCategory]);

  const canSubmit = text.trim().length > 0 && category.trim().length > 0 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = { text: text.trim(), category: category.trim() };
      await onSubmit(payload);

      if (clearOnSuccess) {
        setText("");
        setCategory("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save phrase");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <div>
        <label htmlFor="phrase-text">Text</label>
        <input
          id="phrase-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: "100%" }}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="phrase-category">Category</label>
        <input
          id="phrase-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: "100%" }}
          autoComplete="off"
        />
      </div>

      {error && (
        <div role="alert" style={{ color: "crimson" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={!canSubmit}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>

        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}