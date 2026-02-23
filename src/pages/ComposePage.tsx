import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Mic, Square, Sparkles } from "lucide-react";

import { Button } from "../components/ui/button";
import { speakText } from "../api/tts";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { getDialogueReplies, type DialogueResponse } from "../api/dialogue";

type LocationKey = "HOME" | "SCHOOL" | "OUT";

function getStoredName(): string | null {
  try {
    return localStorage.getItem("aac_name");
  } catch {
    return null;
  }
}

function setStoredName(name: string) {
  try {
    localStorage.setItem("aac_name", name);
  } catch {
    // ignore
  }
}

function getStoredLocation(): LocationKey {
  try {
    const v = localStorage.getItem("aac_location");
    if (v === "HOME" || v === "SCHOOL" || v === "OUT") return v;
  } catch {
    // ignore
  }
  return "HOME";
}

function setStoredLocation(loc: LocationKey) {
  try {
    localStorage.setItem("aac_location", loc);
  } catch {
    // ignore
  }
}

function phraseChoice(item: string) {
  const trimmed = item.trim();
  if (!trimmed) return "Please.";
  // Keep it short and AAC-friendly
  return `${trimmed}, please.`;
}

function phraseInstead(item: string) {
  const trimmed = item.trim();
  if (!trimmed) return "Could I have something else, please?";
  return `Could I have ${trimmed.toLowerCase()} instead, please?`;
}

const ICON_MAP: Record<string, string> = {
  water: "💧",
  juice: "🧃",
  "apple juice": "🧃",
  "orange juice": "🧃",
  "grape juice": "🧃",
  milk: "🥛",
  tea: "☕",
  coffee: "☕",

  apple: "🍎",
  banana: "🍌",
  bread: "🍞",
  toast: "🍞",
  yogurt: "🥣",
  fruit: "🍎",
  sandwich: "🥪",
  pasta: "🍝",
  chicken: "🍗",

  toilet: "🚽",
  bathroom: "🚽",
  help: "🆘",
  "show me": "👀",
  again: "🔁",

  drawing: "🎨",
  draw: "🎨",
  music: "🎵",
  game: "🎮",
  minecraft: "🎮",
  park: "🏞️",
  walk: "🚶"
};

function iconForText(text: string) {
  const t = (text || "").trim().toLowerCase();
  if (!t) return "";

  if (ICON_MAP[t]) return ICON_MAP[t];

  // light heuristics for common phrases
  if (t.includes("juice")) return "🧃";
  if (t.includes("water")) return "💧";
  if (t.includes("milk")) return "🥛";
  if (t.includes("toilet") || t.includes("bathroom")) return "🚽";
  if (t.includes("help")) return "🆘";
  if (t.includes("draw")) return "🎨";
  if (t.includes("game")) return "🎮";

  return "";
}

// If label starts with an emoji (e.g., "🧃 Juice"), split it.
// Otherwise fallback to icon map based on label text.
function splitIconLabel(label: string) {
  const raw = (label || "").trim();
  if (!raw) return { icon: "", text: "" };

  // Emoji prefix: "🧃 Juice"
  const m = raw.match(/^\s*(\p{Extended_Pictographic}(?:\uFE0F)?)\s+(.*)$/u);
  if (m) {
    return { icon: m[1], text: m[2].trim() };
  }

  return { icon: iconForText(raw), text: raw };
}

export function ConversationPage() {
  const stt = useSpeechToText();

  const [name, setName] = useState(() => getStoredName() ?? "");
  const [hasName, setHasName] = useState(() => Boolean(getStoredName()));
  const [nameInput, setNameInput] = useState("");

  const [location, setLocation] = useState<LocationKey>(() => getStoredLocation());

  const [questionText, setQuestionText] = useState("");
  const [showMore, setShowMore] = useState(false);

  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ai, setAi] = useState<DialogueResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [statusMsg, setStatusMsg] = useState("");

  const nameRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const lastRequestedQuestionRef = useRef<string>("");

  useEffect(() => {
    if (!hasName) setTimeout(() => nameRef.current?.focus(), 50);
  }, [hasName]);

  useEffect(() => {
    if (stt.finalText) setQuestionText(stt.finalText);
  }, [stt.finalText]);

  useEffect(() => {
    setStoredLocation(location);
  }, [location]);

  const prompt = useMemo(() => {
    if (questionText.trim()) return questionText.trim();
    return `${name}, would you like a drink?`;
  }, [name, questionText]);

  const announce = (msg: string) => setStatusMsg(msg);

  const speak = async (text: string) => {
    setError(null);
    setSpeaking(true);
    announce("Speaking");

    try {
      await speakText(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to speak");
      announce("Error speaking");
    } finally {
      setSpeaking(false);
      setTimeout(() => announce(""), 500);
    }
  };

  const completeOnboarding = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    setStoredName(trimmed);
    setName(trimmed);
    setHasName(true);
    setNameInput("");

    await speak(`Hi ${trimmed}.`);
  };

  const resetName = () => {
    try {
      localStorage.removeItem("aac_name");
    } catch {
      // ignore
    }

    setHasName(false);
    setName("");
    setShowMore(false);
    setQuestionText("");
    setAi(null);
    setAiError(null);
    lastRequestedQuestionRef.current = "";
  };

  const clearHeardQuestion = () => {
    setQuestionText("");
    setAi(null);
    setAiError(null);
    lastRequestedQuestionRef.current = "";
    setShowMore(false);
  };

  // Generate AI replies only when there is a real question (not the default prompt)
  useEffect(() => {
    if (!hasName) return;

    const q = questionText.trim();
    if (!q) return;
    if (stt.listening) return;

    if (q === lastRequestedQuestionRef.current) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      lastRequestedQuestionRef.current = q;
      setAiLoading(true);
      setAiError(null);

      getDialogueReplies({
        userName: name,
        questionText: q,
        context: { location }
      })
        .then((res) => setAi(res))
        .catch((e) =>
          setAiError(e instanceof Error ? e.message : "Failed to get AI replies")
        )
        .finally(() => setAiLoading(false));
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [questionText, name, hasName, stt.listening, location]);

  // Onboarding screen
  if (!hasName) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-[28px] border border-indigo-100 bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-black tracking-tight">Welcome</h1>
          <p className="mt-3 text-lg text-slate-600">
            What should I call you?
          </p>

          <div className="mt-6">
            <label className="text-sm font-semibold text-slate-700">
              Your name
            </label>
            <input
              ref={nameRef}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="mt-2 w-full rounded-[18px] border-2 border-indigo-200 bg-white px-4 py-3 text-xl"
              placeholder="e.g. Sophie"
              autoComplete="name"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => void completeOnboarding()}
              disabled={speaking || !nameInput.trim()}
              className="rounded-[18px] px-5 py-6 text-lg"
            >
              {speaking ? "Speaking…" : "Continue"}
            </Button>

            <Button
              variant="secondary"
              onClick={() => void speak("Hello. This is your AAC device.")}
              disabled={speaking}
              className="rounded-[18px] px-5 py-6 text-lg"
            >
              Test voice
            </Button>
          </div>

          {error && (
            <div className="mt-6 rounded-[18px] border border-rose-200 bg-rose-50 p-4 text-rose-800">
              {error}
            </div>
          )}

          <p className="mt-6 text-sm text-slate-500">
            Saved on this device for demo purposes.
          </p>

          {statusMsg && (
            <div className="mt-3 text-sm text-slate-500" aria-live="polite">
              {statusMsg}
            </div>
          )}
        </div>
      </div>
    );
  }

  const replies = ai?.topReplies?.slice(0, 3) ?? [];
  const optionGroups = ai?.optionGroups ?? [];

  const locationLabel =
    location === "HOME" ? "Home" : location === "SCHOOL" ? "School" : "Out";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="rounded-[28px] border border-indigo-100 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-6xl font-black tracking-tight">Conversation</h1>
            <p className="mt-3 text-lg text-slate-600">
              Tap Listen to capture a question, then choose a reply to speak.
            </p>
          </div>

          <div className="rounded-[22px] border border-indigo-100 bg-indigo-50/50 p-2">
            <div className="px-2 pb-1 text-xs font-semibold text-indigo-700">
              Location
            </div>
            <div role="group" aria-label="Location" className="flex gap-2">
              <button
                type="button"
                onClick={() => setLocation("HOME")}
                className={`rounded-[16px] px-4 py-3 text-sm font-semibold transition ${
                  location === "HOME"
                    ? "bg-white shadow-sm ring-2 ring-indigo-300"
                    : "bg-transparent hover:bg-white/60"
                }`}
                aria-pressed={location === "HOME"}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => setLocation("SCHOOL")}
                className={`rounded-[16px] px-4 py-3 text-sm font-semibold transition ${
                  location === "SCHOOL"
                    ? "bg-white shadow-sm ring-2 ring-indigo-300"
                    : "bg-transparent hover:bg-white/60"
                }`}
                aria-pressed={location === "SCHOOL"}
              >
                School
              </button>
              <button
                type="button"
                onClick={() => setLocation("OUT")}
                className={`rounded-[16px] px-4 py-3 text-sm font-semibold transition ${
                  location === "OUT"
                    ? "bg-white shadow-sm ring-2 ring-indigo-300"
                    : "bg-transparent hover:bg-white/60"
                }`}
                aria-pressed={location === "OUT"}
              >
                Out
              </button>
            </div>
            <div className="px-2 pt-1 text-xs text-slate-600">
              Current: <span className="font-semibold">{locationLabel}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[22px] border border-indigo-100 bg-indigo-50/40 p-6">
          <div className="text-sm font-semibold text-indigo-700">Prompt</div>
          <div className="mt-2 text-4xl font-black tracking-tight">{prompt}</div>

          {stt.listening && stt.interimText && (
            <div className="mt-4 rounded-[18px] bg-white/70 px-4 py-3 text-slate-700">
              <span className="font-semibold">Hearing:</span> {stt.interimText}
            </div>
          )}

          {stt.error && (
            <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
              {stt.error}
            </div>
          )}

          <div className="mt-4 text-sm text-slate-600">
            {aiLoading
              ? "Generating replies…"
              : ai?.intent
              ? `Intent: ${ai.intent}`
              : "Waiting for a question…"}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => void speak(prompt)}
              disabled={speaking}
              className="rounded-[18px] px-5 py-6 text-lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {speaking ? "Speaking…" : "Speak prompt"}
            </Button>

            <Button
              onClick={() => void (stt.listening ? stt.stop() : stt.start())}
              disabled={speaking}
              className="rounded-[18px] px-5 py-6 text-lg"
            >
              {stt.listening ? (
                <Square className="mr-2 h-5 w-5" />
              ) : (
                <Mic className="mr-2 h-5 w-5" />
              )}
              {stt.listening ? "Stop listening" : "Listen"}
            </Button>

            <Button
              variant="outline"
              onClick={clearHeardQuestion}
              disabled={speaking}
              className="rounded-[18px] px-5 py-6 text-lg"
            >
              Clear question
            </Button>
          </div>

          {(error || aiError) && (
            <div className="mt-5 rounded-[18px] border border-rose-200 bg-rose-50 p-4 text-rose-800">
              {error ?? aiError}
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {replies.length === 3 ? (
            replies.map((r) => {
              const { icon, text } = splitIconLabel(r.label || "");
              return (
                <button
                  key={`${r.label}-${r.text}`}
                  type="button"
                  onClick={() => void speak(r.text)}
                  disabled={speaking}
                  aria-label={`Speak: ${r.text}`}
                  className="group rounded-[24px] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md disabled:opacity-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-500">
                      {text || "Option"}
                    </div>
                    {icon && (
                      <div
                        className="text-4xl leading-none"
                        aria-hidden="true"
                        title={text}
                      >
                        {icon}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-2xl font-extrabold leading-snug">
                    {r.text}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="col-span-full rounded-[22px] border border-slate-200 bg-slate-50 p-6 text-slate-700">
              Ask a question (or click Listen) to generate replies.
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowMore((v) => !v)}
            disabled={speaking || optionGroups.length === 0}
            className="rounded-[18px] px-5 py-6 text-lg"
          >
            <ChevronDown className="mr-2 h-5 w-5" />
            {showMore
              ? "Hide options"
              : optionGroups.length
              ? "More options"
              : "No options"}
          </Button>

          <Button
            variant="outline"
            onClick={resetName}
            disabled={speaking}
            className="rounded-[18px] px-5 py-6 text-lg"
          >
            Change name
          </Button>
        </div>

        {showMore && optionGroups.length > 0 && (
          <div className="mt-8 space-y-6">
            {optionGroups.map((g) => (
              <div
                key={`${g.id}-${g.title}`}
                className="rounded-[22px] border border-slate-200 bg-slate-50 p-6"
              >
                <div className="text-xl font-black">{g.title}</div>
                <p className="mt-1 text-sm text-slate-600">
                  Tap an item to speak it.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {g.items.slice(0, 8).map((item) => {
                    const icon = iconForText(item);
                    const label = item
                      ? item[0].toUpperCase() + item.slice(1)
                      : "Item";

                    return (
                      <Button
                        key={item}
                        onClick={() => void speak(phraseChoice(label))}
                        disabled={speaking}
                        className="rounded-[18px]"
                      >
                        <span className="mr-2" aria-hidden="true">
                          {icon || "•"}
                        </span>
                        {label}
                      </Button>
                    );
                  })}
                </div>

                {g.items[0] && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const first = g.items[0];
                        const label =
                          first[0].toUpperCase() + first.slice(1);
                        return void speak(phraseChoice(label));
                      }}
                      disabled={speaking}
                      className="rounded-[18px]"
                    >
                      Choose — {g.items[0]}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const first = g.items[0];
                        const label =
                          first[0].toUpperCase() + first.slice(1);
                        return void speak(phraseInstead(label));
                      }}
                      disabled={speaking}
                      className="rounded-[18px]"
                    >
                      Instead — {g.items[0]}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {statusMsg && (
          <div className="mt-6 text-sm text-slate-500" aria-live="polite">
            {statusMsg}
          </div>
        )}
      </div>
    </div>
  );
}