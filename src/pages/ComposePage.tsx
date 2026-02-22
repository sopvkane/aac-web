import { useEffect, useMemo, useRef, useState } from "react";
import { suggestionsApi } from "../api/suggestions";
import type { LocationCategory, SuggestionItem, TimeBucket } from "../types/suggestions";
import { getLocalTimeBucket } from "../util/timeBucket";
import { Button } from "../components/ui/button";
import { SelectContent, SelectItem, SelectRoot, SelectTrigger } from "../components/ui/select";
import { seedDemoPhrasesIfEmpty } from "../demo/seedPhrases";
import {
  HandHelping,
  Droplet,
  Smile,
  Frown,
  HeartPulse,
  Home,
  Utensils,
  Gamepad2,
  MessageCircle,
  ArrowRightCircle,
  Sparkles,
} from "lucide-react";

const LOCATION_OPTIONS: LocationCategory[] = ["HOME", "SCHOOL", "WORK", "OTHER"];

// Maps a phrase category to a colour + icon (AAC-friendly, high contrast)
function categoryStyle(category: string) {
  const c = (category || "").toLowerCase();

  if (c.includes("need")) {
    return {
      chip: "bg-emerald-100 text-emerald-900 border-emerald-200",
      card: "border-emerald-200 hover:bg-emerald-50",
      Icon: Droplet,
      label: "Needs",
    };
  }
  if (c.includes("help")) {
    return {
      chip: "bg-indigo-100 text-indigo-900 border-indigo-200",
      card: "border-indigo-200 hover:bg-indigo-50",
      Icon: HandHelping,
      label: "Help",
    };
  }
  if (c.includes("health")) {
    return {
      chip: "bg-rose-100 text-rose-900 border-rose-200",
      card: "border-rose-200 hover:bg-rose-50",
      Icon: HeartPulse,
      label: "Health",
    };
  }
  if (c.includes("answer") || c.includes("yes") || c.includes("no")) {
    return {
      chip: "bg-amber-100 text-amber-900 border-amber-200",
      card: "border-amber-200 hover:bg-amber-50",
      Icon: ArrowRightCircle,
      label: "Answers",
    };
  }
  if (c.includes("social")) {
    return {
      chip: "bg-sky-100 text-sky-900 border-sky-200",
      card: "border-sky-200 hover:bg-sky-50",
      Icon: MessageCircle,
      label: "Social",
    };
  }
  if (c.includes("food") || c.includes("hungry")) {
    return {
      chip: "bg-lime-100 text-lime-900 border-lime-200",
      card: "border-lime-200 hover:bg-lime-50",
      Icon: Utensils,
      label: "Food",
    };
  }
  if (c.includes("activity") || c.includes("play")) {
    return {
      chip: "bg-violet-100 text-violet-900 border-violet-200",
      card: "border-violet-200 hover:bg-violet-50",
      Icon: Gamepad2,
      label: "Activity",
    };
  }
  if (c.includes("travel") || c.includes("home")) {
    return {
      chip: "bg-cyan-100 text-cyan-900 border-cyan-200",
      card: "border-cyan-200 hover:bg-cyan-50",
      Icon: Home,
      label: "Travel",
    };
  }

  return {
    chip: "bg-zinc-100 text-zinc-900 border-zinc-200",
    card: "border-zinc-200 hover:bg-zinc-50",
    Icon: Sparkles,
    label: "General",
  };
}

export function ComposePage() {
  const [text, setText] = useState("");
  const [locationCategory, setLocationCategory] = useState<LocationCategory>("HOME");
  const [timeBucket, setTimeBucket] = useState<TimeBucket>(() => getLocalTimeBucket());

  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live region message for SR users
  const [statusMsg, setStatusMsg] = useState<string>("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  const prefix = useMemo(() => text.trim(), [text]);

  // ✅ Seed demo phrases once on mount (fixes your unused import)
  useEffect(() => {
    seedDemoPhrasesIfEmpty().catch(() => {
      // fail silently so UI still loads if API is unavailable
    });
  }, []);

  // Update time bucket every minute
  useEffect(() => {
    const id = window.setInterval(() => setTimeBucket(getLocalTimeBucket()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const announce = (msg: string) => setStatusMsg(msg);

  const loadSuggestions = async (p: string, t: TimeBucket, loc: LocationCategory) => {
    setError(null);
    setLoading(true);
    announce("Loading suggestions…");

    try {
      const res = await suggestionsApi.suggest({ prefix: p, timeBucket: t, locationCategory: loc });
      setSuggestions(res.suggestions);

      if (res.suggestions.length === 0) announce("No suggestions available.");
      else if (res.suggestions.length === 1) announce("1 suggestion available.");
      else announce(`${res.suggestions.length} suggestions available.`);
    } catch (err) {
      setSuggestions([]);
      const msg = err instanceof Error ? err.message : "Failed to load suggestions";
      setError(msg);
      announce("Error loading suggestions.");
    } finally {
      setLoading(false);
    }
  };

  // Debounced suggestions refresh when prefix/context changes
  useEffect(() => {
    if (prefix.length < 2) {
      setSuggestions([]);
      setError(null);
      setLoading(false);
      announce(prefix.length === 0 ? "Start typing to see suggestions." : "Type one more character for suggestions.");
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      void loadSuggestions(prefix, timeBucket, locationCategory);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [prefix, timeBucket, locationCategory]);

  const applySuggestion = (s: SuggestionItem, idx?: number) => {
    setText(s.phrase.text);
    announce(idx != null ? `Suggestion ${idx + 1} applied.` : "Suggestion applied.");
    textareaRef.current?.focus();
  };

  // Keyboard shortcuts: Alt+1/2/3 apply suggestion
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === "1" || e.key === "2" || e.key === "3") {
        const idx = Number(e.key) - 1;
        const s = suggestions[idx];
        if (s) {
          e.preventDefault();
          applySuggestion(s, idx);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [suggestions]);

  return (
    <section aria-labelledby="compose-title" className="grid gap-8">
      <header className="grid gap-2">
        <h1 id="compose-title" className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900">
          Compose
        </h1>
        <p className="text-zinc-700 text-lg sm:text-xl">
          Type a message, then tap a suggestion. <span className="font-semibold">(Alt+1/2/3)</span> selects top suggestions.
        </p>
      </header>

      {/* Screen-reader status region */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMsg}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose panel */}
        <div className="rounded-[28px] border-2 border-indigo-100 bg-white/80 backdrop-blur p-6 shadow-[var(--shadow)]">
          <div className="grid gap-3">
            <label htmlFor="compose-text" className="text-xl font-semibold text-zinc-900">
              Message
            </label>

            <textarea
              id="compose-text"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="min-h-30 w-full rounded-[22px] border-2 border-indigo-200 bg-white p-4 text-xl placeholder:text-zinc-400"
              placeholder="Start typing…"
              aria-controls="suggestions-list"
              aria-describedby="compose-help compose-status"
            />

            <div className="grid gap-1">
              <p id="compose-help" className="text-base text-zinc-700">
                Suggestions update as you type. Use Tab to reach them, or Alt+1/2/3.
              </p>

              <p id="compose-status" className="text-base text-zinc-700" aria-live="polite">
                {loading ? "Loading suggestions…" : prefix.length < 2 ? "Type at least 2 characters." : null}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-xl font-semibold text-zinc-900" id="location-label">
                Location
              </span>

              <SelectRoot value={locationCategory} onValueChange={(v) => setLocationCategory(v as LocationCategory)}>
                <SelectTrigger
                  aria-labelledby="location-label"
                  className="rounded-[18px] border-2 border-indigo-200 bg-indigo-50 px-4"
                >
                  {locationCategory}
                </SelectTrigger>
                <SelectContent className="rounded-[18px]">
                  {LOCATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="rounded-xl py-3 text-lg">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </div>

            <div className="grid gap-2">
              <span className="text-xl font-semibold text-zinc-900">Time bucket</span>
              <div className="min-h-[44px] rounded-[18px] border-2 border-indigo-100 bg-indigo-50 px-4 py-3 text-lg flex items-center">
                {timeBucket}
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions panel */}
        <section
          aria-labelledby="suggestions-title"
          className="rounded-[28px] border-2 border-indigo-100 bg-white/80 backdrop-blur p-6 shadow-[var(--shadow)]"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="suggestions-title" className="text-2xl font-extrabold text-zinc-900">
              Suggestions
            </h2>
            <span className="text-base text-zinc-700" aria-hidden>
              {suggestions.length > 0 ? `${suggestions.length} shown` : ""}
            </span>
          </div>

          {error && (
            <div role="alert" className="mt-4 rounded-[18px] border-2 border-red-300 bg-red-50 p-4 text-red-900 text-lg">
              {error}
            </div>
          )}

          <ul id="suggestions-list" className="mt-4 grid gap-3" aria-label="Suggested phrases">
            {suggestions.length === 0 ? (
              <li className="text-lg text-zinc-700">
                {prefix.length < 2 ? "Start typing to see suggestions." : loading ? "Loading…" : "No suggestions."}
              </li>
            ) : (
              suggestions.map((s, idx) => {
                const style = categoryStyle(s.phrase.category);
                const Icon = style.Icon;

                return (
                  <li key={`${s.phrase.id}-${idx}`}>
                    <Button
                      type="button"
                      variant="outline"
                      className={`w-full justify-start text-left min-h-14 px-5 py-4 rounded-[22px] border-2 ${style.card}`}
                      onClick={() => applySuggestion(s, idx)}
                      aria-label={`Use suggestion ${idx + 1}: ${s.phrase.text}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-white border-2 border-zinc-200">
                          <Icon aria-hidden className="h-6 w-6" />
                        </div>

                        <div className="grid gap-2">
                          <span className="text-xl font-extrabold">{s.phrase.text}</span>

                          <span
                            className={`inline-flex w-fit items-center rounded-full border-2 px-3 py-1 text-sm font-bold ${style.chip}`}
                          >
                            {style.label}
                          </span>

                          <span className="sr-only">Score {s.score.toFixed(2)}</span>
                        </div>
                      </div>
                    </Button>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>
    </section>
  );
}