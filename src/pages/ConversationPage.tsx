import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Mic, Square, Sparkles, Volume2 } from "lucide-react";
import { Icon } from "@iconify/react";

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

function getStoredVoiceMode(): boolean {
  try {
    return localStorage.getItem("aac_voice_mode") === "true";
  } catch {
    return false;
  }
}

function setStoredVoiceMode(v: boolean) {
  try {
    localStorage.setItem("aac_voice_mode", String(v));
  } catch {
    // ignore
  }
}

function getStoredShowSpokenText(): boolean {
  try {
    return localStorage.getItem("aac_show_spoken_text") === "true";
  } catch {
    return false;
  }
}

function setStoredShowSpokenText(v: boolean) {
  try {
    localStorage.setItem("aac_show_spoken_text", String(v));
  } catch {
    // ignore
  }
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phraseChoice(item: string) {
  const trimmed = item.trim();
  if (!trimmed) return "Please.";
  return `${trimmed}, please.`;
}

function phraseInstead(item: string) {
  const trimmed = item.trim();
  if (!trimmed) return "Could I have something else, please?";
  return `Could I have ${trimmed.toLowerCase()} instead, please?`;
}

// If label starts with an emoji ("🧃 Juice"), strip it so icon mapping works cleanly.
function stripEmojiPrefix(label: string) {
  const raw = (label || "").trim();
  if (!raw) return "";
  const m = raw.match(/^\s*(\p{Extended_Pictographic}(?:\uFE0F)?)\s+(.*)$/u);
  return m ? m[2].trim() : raw;
}

function normaliseKey(s: string) {
  return (s || "").trim().toLowerCase();
}

/**
 * Iconify mapping using Twemoji (colourful SVG icons).
 * You can expand this list as you add more domains.
 */
const ICONIFY_MAP: Record<string, string> = {
  yes: "twemoji:thumbs-up",
  no: "twemoji:thumbs-down",
  repeat: "twemoji:counterclockwise-arrows-button",
  again: "twemoji:counterclockwise-arrows-button",
  "say again": "twemoji:counterclockwise-arrows-button",
  help: "twemoji:sos-button",
  "show me": "twemoji:eyes",
  toilet: "twemoji:toilet",
  bathroom: "twemoji:toilet",

  water: "twemoji:droplet",
  juice: "twemoji:beverage-box",
  milk: "twemoji:glass-of-milk",
  tea: "twemoji:teacup-without-handle",
  coffee: "twemoji:hot-beverage",

  apple: "twemoji:red-apple",
  banana: "twemoji:banana",
  bread: "twemoji:bread",
  toast: "twemoji:bread",
  sandwich: "twemoji:sandwich",
  cheese: "twemoji:cheese-wedge",
  ham: "twemoji:cut-of-meat",
  pasta: "twemoji:spaghetti",
  chicken: "twemoji:poultry-leg",
  fruit: "twemoji:green-apple",
  yogurt: "twemoji:bowl-with-spoon",

  ice: "twemoji:ice-cube",
  "no ice": "twemoji:ice-cube"
};

function iconifyKeyFor(label: string) {
  const t = normaliseKey(stripEmojiPrefix(label));
  if (!t) return "";

  if (ICONIFY_MAP[t]) return ICONIFY_MAP[t];

  // heuristics
  if (t.includes("juice")) return ICONIFY_MAP.juice;
  if (t.includes("water")) return ICONIFY_MAP.water;
  if (t.includes("milk")) return ICONIFY_MAP.milk;
  if (t.includes("tea")) return ICONIFY_MAP.tea;
  if (t.includes("toilet") || t.includes("bathroom")) return ICONIFY_MAP.toilet;
  if (t.includes("help")) return ICONIFY_MAP.help;
  if (t.includes("repeat") || t.includes("again")) return ICONIFY_MAP.repeat;
  if (t.includes("ice")) return ICONIFY_MAP.ice;
  if (t.includes("sandwich")) return ICONIFY_MAP.sandwich;
  if (t.includes("cheese")) return ICONIFY_MAP.cheese;
  if (t.includes("ham")) return ICONIFY_MAP.ham;
  if (t.includes("apple")) return ICONIFY_MAP.apple;
  if (t.includes("banana")) return ICONIFY_MAP.banana;
  if (t.includes("bread") || t.includes("toast")) return ICONIFY_MAP.bread;

  return "";
}

function Pictogram({ label }: { label: string }) {
  const key = iconifyKeyFor(label);
  if (key) {
    return (
      <span className="aac-picto" aria-hidden="true">
        <Icon icon={key} width="62" height="62" />
      </span>
    );
  }

  // fallback letter badge
  const clean = stripEmojiPrefix(label);
  const letter = (clean.trim()[0] || "?").toUpperCase();
  return (
    <span className="aac-letter" aria-hidden="true">
      {letter}
    </span>
  );
}

export function ConversationPage() {
  const stt = useSpeechToText();

  const [name, setName] = useState(() => getStoredName() ?? "");
  const [hasName, setHasName] = useState(() => Boolean(getStoredName()));
  const [nameInput, setNameInput] = useState("");

  const [location, setLocation] = useState<LocationKey>(() => getStoredLocation());
  const [voiceMode, setVoiceMode] = useState(() => getStoredVoiceMode());
  const [showSpokenText, setShowSpokenText] = useState(() => getStoredShowSpokenText());

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

  // Wake phrase gating (browser-friendly approach)
  const wakeArmedRef = useRef(false);
  const wakeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasName) setTimeout(() => nameRef.current?.focus(), 50);
  }, [hasName]);

  useEffect(() => {
    setStoredLocation(location);
  }, [location]);

  useEffect(() => {
    setStoredVoiceMode(voiceMode);
  }, [voiceMode]);

  useEffect(() => {
    setStoredShowSpokenText(showSpokenText);
  }, [showSpokenText]);

  const prompt = useMemo(() => {
    if (questionText.trim()) return questionText.trim();
    return `Say “Hey ${name}” then ask a question.`;
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
    wakeArmedRef.current = false;
  };

  const clearHeardQuestion = () => {
    setQuestionText("");
    setAi(null);
    setAiError(null);
    lastRequestedQuestionRef.current = "";
    setShowMore(false);
    wakeArmedRef.current = false;
    announce("");
  };

  const setWakeArmed = (armed: boolean) => {
    wakeArmedRef.current = armed;
    if (wakeTimeoutRef.current) window.clearTimeout(wakeTimeoutRef.current);

    if (armed) {
      announce(`Heard “Hey ${name}”. Listening…`);
      wakeTimeoutRef.current = window.setTimeout(() => {
        wakeArmedRef.current = false;
        announce("");
      }, 7000);
    } else {
      announce("");
    }
  };

  const toggleVoiceMode = async () => {
    if (voiceMode) {
      setVoiceMode(false);
      setWakeArmed(false);
      await stt.stop();
      return;
    }

    setVoiceMode(true);
    setWakeArmed(false);
    await stt.start();
  };

  // Wake phrase handling
  useEffect(() => {
    const heard = (stt.finalText || "").trim();
    if (!heard) return;
    if (!hasName) return;

    if (!voiceMode) {
      setQuestionText(heard);
      return;
    }

    const nameLower = (name || "").trim().toLowerCase();
    if (!nameLower) return;

    const wakeRe = new RegExp(
      `^\\s*hey\\s+${escapeRegExp(nameLower)}\\b[\\s,!.:-]*`,
      "i"
    );

    if (wakeRe.test(heard.toLowerCase())) {
      const after = heard.replace(wakeRe, "").trim();
      if (after) {
        setWakeArmed(false);
        setQuestionText(after);
      } else {
        setWakeArmed(true);
      }
      return;
    }

    if (wakeArmedRef.current) {
      setWakeArmed(false);
      setQuestionText(heard);
      return;
    }
  }, [stt.finalText, voiceMode, name, hasName]);

  // Generate AI replies
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

  // Onboarding
  if (!hasName) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="aac-card p-8">
          <h1 className="text-4xl font-black tracking-tight">Welcome</h1>
          <p className="mt-3 text-lg text-slate-700">What should I call you?</p>

          <div className="mt-6">
            <label className="text-sm font-semibold text-slate-700">Your name</label>
            <input
              ref={nameRef}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="mt-2 w-full aac-input px-4 py-3 text-xl"
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
        </div>
      </div>
    );
  }

  const replies = ai?.topReplies?.slice(0, 3) ?? [];
  const optionGroups = ai?.optionGroups ?? [];
  const tones = ["aac-tone-a", "aac-tone-b", "aac-tone-c"];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="aac-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-6xl font-black tracking-tight">Conversation</h1>
            <p className="mt-2 text-lg text-slate-700">
              Say <span className="font-black">“Hey {name}”</span> then ask a question.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="aac-panel p-2">
              <div className="px-2 pb-1 text-xs font-semibold text-indigo-800">
                Location
              </div>
              <div role="group" aria-label="Location" className="flex gap-2">
                {(["HOME", "SCHOOL", "OUT"] as LocationKey[]).map((loc) => {
                  const label =
                    loc === "HOME" ? "Home" : loc === "SCHOOL" ? "School" : "Out";
                  const active = location === loc;
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={`aac-pill ${active ? "aac-pill--active" : ""}`}
                      aria-pressed={active}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSpokenText((v) => !v)}
                className={`aac-pill w-full justify-center ${
                  showSpokenText ? "aac-pill--active" : ""
                }`}
                aria-pressed={showSpokenText}
                title="Toggle showing full spoken sentences on tiles"
              >
                {showSpokenText ? "Details: ON" : "Details: OFF"}
              </button>

              <Button
                onClick={() => void toggleVoiceMode()}
                disabled={speaking}
                className="rounded-[18px] px-5 py-6 text-lg"
                variant={voiceMode ? "default" : "secondary"}
              >
                <Mic className="mr-2 h-5 w-5" />
                {voiceMode ? "Voice: ON" : "Voice: OFF"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 aac-panel p-6">
          <div className="text-sm font-semibold text-indigo-800">Prompt</div>
          <div className="mt-2 text-4xl font-black tracking-tight">{prompt}</div>

          {showSpokenText && (
            <div className="mt-4 text-sm text-slate-700">
              {aiLoading
                ? "Generating replies…"
                : ai?.intent
                ? `Intent: ${ai.intent}`
                : voiceMode
                ? `Voice mode on. Say “Hey ${name}”.`
                : "Voice mode off. Tap Listen."}
            </div>
          )}

          {(error || aiError || stt.error) && (
            <div className="mt-5 rounded-[18px] border border-rose-200 bg-rose-50 p-4 text-rose-800">
              {error ?? aiError ?? stt.error}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => void speak(prompt)}
              disabled={speaking}
              className="rounded-[18px] px-5 py-6 text-lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Speak prompt
            </Button>

            <Button
              onClick={() => void (stt.listening ? stt.stop() : stt.start())}
              disabled={speaking || voiceMode}
              className="rounded-[18px] px-5 py-6 text-lg"
              title={voiceMode ? "Voice mode is on" : ""}
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

          {statusMsg && (
            <div className="mt-4 text-sm text-slate-700" aria-live="polite">
              {statusMsg}
            </div>
          )}
        </div>

        {/* AAC tiles: icon + short label by default */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {replies.length === 3 ? (
            replies.map((r, idx) => {
              const shortLabel = stripEmojiPrefix(r.label || "Option") || "Option";
              return (
                <button
                  key={`${r.label}-${r.text}`}
                  type="button"
                  onClick={() => void speak(r.text)}
                  disabled={speaking}
                  aria-label={`Speak: ${r.text}`}
                  className={`aac-tile ${tones[idx]}`}
                >
                  <div className="aac-tile-top">
                    <div className="aac-tile-label">{shortLabel}</div>
                    <Pictogram label={shortLabel} />
                  </div>

                  {showSpokenText && (
                    <div className="aac-tile-speech">{r.text}</div>
                  )}

                  <div className="aac-tile-hint">
                    <Volume2 className="h-4 w-4" />
                    Tap to speak
                  </div>
                </button>
              );
            })
          ) : (
            <div className="col-span-full rounded-[22px] border border-slate-200 bg-slate-50 p-6 text-slate-800">
              Say “Hey {name}” then ask a question to generate replies.
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
            {showMore ? "Hide options" : optionGroups.length ? "More options" : "No options"}
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
              <div key={`${g.id}-${g.title}`} className="aac-panel p-6">
                <div className="text-2xl font-black">{g.title}</div>
                <p className="mt-1 text-base text-slate-700">
                  Tap an item to speak it.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {g.items.slice(0, 10).map((item) => {
                    const label = item ? item[0].toUpperCase() + item.slice(1) : "Item";
                    return (
                      <Button
                        key={item}
                        onClick={() => void speak(phraseChoice(label))}
                        disabled={speaking}
                        className="rounded-[18px]"
                      >
                        <span className="mr-2" aria-hidden="true">
                          <Icon
                            icon={iconifyKeyFor(label) || "twemoji:speech-balloon"}
                            width="26"
                            height="26"
                          />
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
                        const label = first[0].toUpperCase() + first.slice(1);
                        return void speak(phraseChoice(label));
                      }}
                      disabled={speaking}
                      className="rounded-[18px] px-5 py-6 text-lg"
                    >
                      Choose — {g.items[0]}
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => {
                        const first = g.items[0];
                        const label = first[0].toUpperCase() + first.slice(1);
                        return void speak(phraseInstead(label));
                      }}
                      disabled={speaking}
                      className="rounded-[18px] px-5 py-6 text-lg"
                    >
                      Instead — {g.items[0]}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}