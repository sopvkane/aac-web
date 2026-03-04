import { useEffect, useMemo, useRef, useState } from "react";
import { Home, GraduationCap, Car, Mic, Square, Sparkles, Volume2, X, Grid3X3, ChevronDown, ChevronUp, User } from "lucide-react";
import { Icon } from "@iconify/react";

import { Button } from "../components/ui/button";
import { speakText } from "../api/tts";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { getDialogueReplies, type DialogueResponse } from "../api/dialogue";
import { interactionsApi } from "../api/interactions";

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

// Global icon choices (Material-like set via Iconify)
const KIND_ICON_MAP: Record<string, string> = {
  DRINK: "mdi:cup-water",
  FOOD: "mdi:food",
  ACTIVITY: "mdi:controller-classic",
  FAMILY_MEMBER: "mdi:account-heart",
  SCHOOL_PEER: "mdi:account-school",
  TEACHER: "mdi:account-tie",
  SUBJECT: "mdi:book-open-variant",
  FOOD_INSTEAD: "mdi:food-fork-drink",
  CONFIRM: "mdi:thumb-up",
  REJECT: "mdi:thumb-down",
  GENERIC: "mdi:message",
};

// Colourful icon mapping – Twemoji (clear, literal) for AAC users who may not read
const ICONIFY_MAP: Record<string, string> = {
  yes: "twemoji:thumbs-up",
  no: "twemoji:thumbs-down",
  "yes please": "twemoji:thumbs-up",
  "no thank you": "twemoji:thumbs-down",
  repeat: "twemoji:repeat-button",
  again: "twemoji:repeat-button",
  "say again": "twemoji:repeat-button",
  help: "twemoji:raised-hand",
  "show me": "twemoji:eyes",
  toilet: "twemoji:restroom",
  bathroom: "twemoji:restroom",

  water: "twemoji:potable-water",
  juice: "twemoji:cup-with-straw",
  "apple juice": "twemoji:cup-with-straw",
  "orange juice": "twemoji:cup-with-straw",
  milk: "twemoji:glass-of-milk",
  tea: "twemoji:teacup-without-handle",
  coffee: "twemoji:hot-beverage",
  "chocolate milk": "twemoji:glass-of-milk",
  glass: "twemoji:glass-of-milk",
  "big glass": "twemoji:clinking-glasses",
  "small glass": "twemoji:teacup-without-handle",

  apple: "twemoji:red-apple",
  banana: "twemoji:banana",
  bread: "twemoji:bread",
  toast: "twemoji:bread",
  sandwich: "twemoji:sandwich",
  cheese: "twemoji:cheese-wedge",
  ham: "twemoji:cut-of-meat",
  pasta: "twemoji:spaghetti",
  chicken: "twemoji:poultry-leg",
  fruit: "twemoji:grapes",
  yogurt: "twemoji:soft-ice-cream",
  pizza: "twemoji:slice-of-pizza",
  cereal: "twemoji:bowl-with-spoon",
  orange: "twemoji:tangerine",
  cupcake: "twemoji:cupcake",
  biscuits: "twemoji:cookie",
  cookie: "twemoji:cookie",

  ice: "twemoji:ice-cube",
  "no ice": "twemoji:no-entry",

  hungry: "twemoji:biting-lip",
  thirsty: "twemoji:droplet",
  "i'm hungry": "twemoji:face-savoring-food",
  "i'm thirsty": "twemoji:droplet",

  instead: "twemoji:counterclockwise-arrows-button",
  "something else": "twemoji:sparkles",

  "not yet": "twemoji:alarm-clock",
  "a bit": "twemoji:sleepy-face",
  "i'm not sure": "twemoji:thinking-face",
  good: "twemoji:thumbs-up",
  okay: "twemoji:neutral-face",
  "not great": "twemoji:slightly-frowning-face",
  sad: "twemoji:slightly-frowning-face",

  bluey: "twemoji:dog-face",
  tv: "twemoji:television",
  "peppa pig": "twemoji:pig-face",
  cocomelon: "twemoji:melon",
  watch: "twemoji:television",
  play: "twemoji:game-die",
  "ipad": "twemoji:mobile-phone",
  tablet: "twemoji:mobile-phone",
  outside: "twemoji:sun",
  activity: "twemoji:person-running",
  game: "twemoji:game-die",
  book: "twemoji:open-book",
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
  if (t.includes("glass")) return t.includes("big") ? ICONIFY_MAP["big glass"] : t.includes("small") ? ICONIFY_MAP["small glass"] : ICONIFY_MAP.glass;
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
  if (t.includes("hungry")) return ICONIFY_MAP.hungry;
  if (t.includes("thirsty")) return ICONIFY_MAP.thirsty;
  if (t.includes("pizza")) return ICONIFY_MAP.pizza;
  if (t.includes("not yet")) return ICONIFY_MAP["not yet"];
  if (t.includes("a bit")) return ICONIFY_MAP["a bit"];
  if (t.includes("not sure")) return ICONIFY_MAP["i'm not sure"];
  if (t.includes("good") && !t.includes("not")) return ICONIFY_MAP.good;
  if (t.includes("okay")) return ICONIFY_MAP.okay;
  if (t.includes("not great")) return ICONIFY_MAP["not great"];
  if (t.includes("bluey")) return ICONIFY_MAP.bluey;
  if (t.includes("peppa") || t.includes("pig")) return ICONIFY_MAP["peppa pig"];
  if (t.includes("cocomelon") || t.includes("melon")) return ICONIFY_MAP.cocomelon;
  if (t.includes("tv") || t.includes("television") || t.includes("watch")) return ICONIFY_MAP.tv;
  if (t.includes("ipad") || t.includes("tablet") || t.includes("phone")) return ICONIFY_MAP.ipad;
  if (t.includes("outside") || t.includes("playground")) return ICONIFY_MAP.outside;
  if (t.includes("play") || t.includes("game")) return ICONIFY_MAP.play;
  if (t.includes("orange")) return ICONIFY_MAP.orange;
  if (t.includes("cereal")) return ICONIFY_MAP.cereal;
  if (t.includes("book")) return ICONIFY_MAP.book;
  if (t.includes("cupcake") || t.includes("cake")) return ICONIFY_MAP.cupcake;
  if (t.includes("biscuit") || t.includes("cookie")) return ICONIFY_MAP.cookie;

  return "";
}

/** Fix "a two" → "two", "a 2" → "2" etc. when LLM incorrectly adds article before quantity. */
function fixArticleBeforeQuantity(text: string): string {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/\b(a|an)\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/gi, "$2")
    .trim();
}

const WORD_TO_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

/** Parse "Two cupcakes" → { count: 2, itemLabel: "cupcakes" }. No number → count 1. */
function parseQuantityAndItem(label: string): { count: number; itemLabel: string } {
  const trimmed = (label || "").trim();
  if (!trimmed) return { count: 1, itemLabel: "" };
  const m = trimmed.match(/^(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(.+)$/i);
  if (m) {
    const numPart = m[1]!.toLowerCase();
    const item = m[2]!.trim();
    const count = WORD_TO_NUM[numPart] ?? (parseInt(numPart, 10) || 1);
    return { count: Math.min(Math.max(count, 1), 10), itemLabel: item };
  }
  return { count: 1, itemLabel: trimmed };
}

const PICTogram_SIZE = 100;

function Pictogram({
  label,
  iconUrl,
  kind,
  size = PICTogram_SIZE,
  count = 1,
}: {
  label: string;
  iconUrl?: string | null;
  kind?: string | null;
  size?: number;
  count?: number;
}) {
  const { count: qty, itemLabel } = parseQuantityAndItem(label);
  const displayCount = count > 1 ? count : qty;
  const iconLabel = itemLabel || label;

  const renderOne = () => {
    if (iconUrl) {
      return (
        <span className="aac-picto shrink-0" aria-hidden="true">
          <img src={iconUrl} alt="" className="object-cover rounded-2xl" style={{ width: size, height: size }} />
        </span>
      );
    }

    const key = iconifyKeyFor(iconLabel);
    if (key) {
      return (
        <span className="aac-picto shrink-0" aria-hidden="true">
          <Icon icon={key} width={size} height={size} />
        </span>
      );
    }

    if (kind && KIND_ICON_MAP[kind]) {
      return (
        <span className="aac-picto shrink-0" aria-hidden="true">
          <Icon icon={KIND_ICON_MAP[kind]} width={size} height={size} />
        </span>
      );
    }

    const clean = stripEmojiPrefix(iconLabel);
    const letter = (clean.trim()[0] || "?").toUpperCase();
    return (
      <span
        className="aac-letter shrink-0 inline-flex items-center justify-center rounded-2xl font-black bg-white/60"
        aria-hidden="true"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {letter}
      </span>
    );
  };

  if (displayCount > 1) {
    const iconSize = Math.round(size * 0.7);
    return (
      <span className="inline-flex items-center justify-center gap-0.5 shrink-0" aria-hidden="true">
        {Array.from({ length: Math.min(displayCount, 5) }).map((_, i) => (
          <span key={i} style={{ width: iconSize, height: iconSize }}>
            {iconUrl ? (
              <img src={iconUrl} alt="" className="object-cover rounded-lg w-full h-full" />
            ) : (
              <Icon icon={iconifyKeyFor(iconLabel) || KIND_ICON_MAP[kind || ""] || "twemoji:cupcake"} width={iconSize} height={iconSize} />
            )}
          </span>
        ))}
      </span>
    );
  }

  return renderOne();
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
    return `Say “Hey ${name}” to ask a question.`;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- setWakeArmed is stable (uses refs)
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

  // Automatically show options when the backend suggests them (e.g. for drink questions).
  const optionGroups = ai?.optionGroups ?? [];
  useEffect(() => {
    if (optionGroups.length > 0) {
      setShowMore(true);
    }
  }, [optionGroups.length]);

  // Onboarding
  if (!hasName) {
    return (
      <div className="w-full px-0 py-0">
        <div className="aac-card p-8">
          <h1 className="text-4xl font-black tracking-tight">Welcome</h1>
          <p className="mt-3 text-lg text-slate-700">What should I call you?</p>

          <div className="mt-6">
            <label htmlFor="conversation-name" className="text-sm font-semibold text-slate-700">
              Your name
            </label>
            <input
              id="conversation-name"
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
  const tones = ["aac-tone-a", "aac-tone-b", "aac-tone-c"];

  return (
    <div className="w-full px-0 py-0">
      <div className="aac-card p-4 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3 py-1">
          <div className="aac-panel p-3">
              <div role="group" aria-label="Location" className="flex gap-2">
                {(["HOME", "SCHOOL", "OUT"] as LocationKey[]).map((loc) => {
                  const label = loc === "HOME" ? "Home" : loc === "SCHOOL" ? "School" : "Out";
                  const active = location === loc;
                  const LocIcon = loc === "HOME" ? Home : loc === "SCHOOL" ? GraduationCap : Car;
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={`aac-pill flex flex-col items-center gap-1 min-w-[72px] py-3 px-4 ${
                        active ? "aac-pill--active" : ""
                      }`}
                      aria-pressed={active}
                      aria-label={label}
                    >
                      <LocIcon className="h-8 w-8" strokeWidth={2.5} aria-hidden />
                      <span className="text-xs font-bold">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSpokenText((v) => !v)}
                className={`aac-pill flex items-center justify-center gap-2 px-4 py-3 ${
                  showSpokenText ? "aac-pill--active" : ""
                }`}
                aria-pressed={showSpokenText}
                aria-label={showSpokenText ? "Details on" : "Details off"}
                title={showSpokenText ? "Details: ON" : "Details: OFF"}
              >
                <Grid3X3 className="h-5 w-5" aria-hidden />
                <span className="text-sm font-bold hidden sm:inline">{showSpokenText ? "ON" : "OFF"}</span>
              </button>

              <Button
                onClick={() => void toggleVoiceMode()}
                disabled={speaking}
                className="rounded-[18px] px-4 py-4 min-h-[52px]"
                variant={voiceMode ? "default" : "secondary"}
                aria-label={voiceMode ? "Voice on" : "Voice off"}
              >
                <Mic className="h-6 w-6" aria-hidden />
                <span className="ml-2 text-sm font-bold hidden sm:inline">{voiceMode ? "ON" : "OFF"}</span>
              </Button>
            </div>
        </header>

        <div className="mt-4 space-y-4">
          {/* Compact prompt strip */}
          <section className="aac-panel p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">Prompt</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight truncate" title={prompt}>
                  {prompt}
                </div>
                {showSpokenText && (
                  <div className="mt-1 text-xs text-slate-700">
                    {aiLoading ? "Thinking…" : ai?.intent ? `Intent: ${ai.intent}` : voiceMode ? `Say "Hey ${name}"` : "Tap Listen."}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {(error || aiError || stt.error) && (
                  <div className="w-full rounded-[18px] border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm text-rose-800">
                    {error ?? aiError ?? stt.error}
                  </div>
                )}
              <Button
                variant="secondary"
                onClick={() => void speak(prompt)}
                disabled={speaking}
                className="rounded-[18px] px-4 py-3 min-h-[52px]"
                aria-label="Speak the question aloud"
              >
                <Sparkles className="h-6 w-6" aria-hidden />
                <span className="ml-2 text-sm font-bold hidden sm:inline">Speak</span>
              </Button>

              <Button
                onClick={() => void (stt.listening ? stt.stop() : stt.start())}
                disabled={speaking || voiceMode}
                className="rounded-[18px] px-4 py-3 min-h-[52px]"
                aria-label={stt.listening ? "Stop listening" : "Listen for question"}
              >
                {stt.listening ? <Square className="h-6 w-6" aria-hidden /> : <Mic className="h-6 w-6" aria-hidden />}
                <span className="ml-2 text-sm font-bold hidden sm:inline">{stt.listening ? "Stop" : "Listen"}</span>
              </Button>

              <Button
                variant="outline"
                onClick={clearHeardQuestion}
                disabled={speaking}
                className="rounded-[18px] px-4 py-3 min-h-[52px]"
                aria-label="Clear question"
              >
                <X className="h-6 w-6" aria-hidden />
                <span className="ml-2 text-sm font-bold hidden sm:inline">Clear</span>
              </Button>
                {statusMsg && (
                  <div className="w-full text-xs text-slate-700" aria-live="polite">
                    {statusMsg}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Big reply tiles - full width for more space */}
          <section
            aria-label="Reply choices"
            className="flex flex-col justify-stretch"
          >
            {replies.length === 3 ? (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                {replies.map((r, idx) => {
                  const shortLabel = stripEmojiPrefix(r.label || "Option") || "Option";
                  const displayText = fixArticleBeforeQuantity(r.text);
                  return (
                    <button
                      key={`${r.label}-${r.text}`}
                      type="button"
                      onClick={() => {
                        void speak(displayText);
                        interactionsApi.record({ location, promptType: "REPLY", selectedText: displayText });
                      }}
                      disabled={speaking}
                      aria-label={displayText}
                      className={`aac-tile aac-tile-animate ${tones[idx]} flex flex-col items-center justify-between py-6 gap-3 active:scale-[0.98] transition-transform`}
                      style={{ animationDelay: `${idx * 80}ms` }}
                    >
                      <div className="flex flex-col items-center gap-3 flex-1 w-full">
                        <Pictogram
                          label={shortLabel}
                          iconUrl={r.iconUrl}
                          kind={r.kind ?? undefined}
                        />
                        <div className="aac-tile-label text-center text-xl sm:text-2xl">{shortLabel}</div>
                        {showSpokenText && (
                          <div className="aac-tile-speech text-center text-base">{displayText}</div>
                        )}
                      </div>

                      <div className="aac-tile-hint flex items-center gap-2 opacity-80" aria-hidden>
                        <Volume2 className="h-6 w-6" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[22px] border-2 border-dashed border-slate-300 bg-slate-50/80 p-8 flex flex-col items-center justify-center gap-4 min-h-[200px]">
                <Mic className="h-16 w-16 text-slate-400 aac-empty-pulse" aria-hidden />
                <p className="text-slate-600 text-center font-semibold max-w-xs">Ask a question to see choices</p>
              </div>
            )}
          </section>
        </div>

        {/* Options panel */}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowMore((v) => !v)}
            disabled={speaking || optionGroups.length === 0}
            className="rounded-[18px] px-5 py-5 min-h-[52px]"
            aria-label={showMore ? "Hide more options" : "Show more options"}
          >
            {showMore ? <ChevronUp className="h-6 w-6" aria-hidden /> : <ChevronDown className="h-6 w-6" aria-hidden />}
            <span className="ml-2 font-bold">{showMore ? "Hide" : "More"}</span>
          </Button>

          <Button
            variant="outline"
            onClick={resetName}
            disabled={speaking}
            className="rounded-[18px] px-5 py-5 min-h-[52px]"
            aria-label="Change name"
          >
            <User className="h-6 w-6" aria-hidden />
            <span className="ml-2 font-bold">Name</span>
          </Button>
        </div>

        {showMore && optionGroups.length > 0 && (
          <div className="mt-4 space-y-5">
            {optionGroups.map((g) => (
              <div key={`${g.id}-${g.title}`} className="aac-panel p-6">
                <div className="text-xl font-black mb-4">{g.title}</div>

                <div className="flex flex-wrap gap-3">
                  {g.items.slice(0, 18).map((item, optIdx) => {
                    const label = item ? item[0].toUpperCase() + item.slice(1) : "Item";
                    const iconKey = iconifyKeyFor(label) || "twemoji:speaking-head";
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          const speech = phraseChoice(label);
                          void speak(speech);
                          interactionsApi.record({ location, promptType: "PHRASE_CHOICE", selectedText: speech });
                        }}
                        disabled={speaking}
                        className="aac-tile aac-option-animate flex flex-col items-center justify-center gap-2 min-w-[100px] py-4 px-3 rounded-2xl border-2 transition-transform active:scale-95 hover:scale-[1.02] hover:-translate-y-0.5"
                        style={{ animationDelay: `${Math.min(optIdx * 25, 300)}ms` }}
                        aria-label={`${label}, please`}
                      >
                        <Icon icon={iconKey} width="80" height="80" aria-hidden />
                        <span className="text-sm font-bold text-center leading-tight">{label}</span>
                      </button>
                    );
                  })}
                </div>

                {g.items[0] && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const first = g.items[0];
                        const label = first[0].toUpperCase() + first.slice(1);
                        const speech = phraseChoice(label);
                        void speak(speech);
                        interactionsApi.record({ location, promptType: "PHRASE_CHOICE", selectedText: speech });
                      }}
                      disabled={speaking}
                      className="rounded-[18px] px-4 py-4 min-h-[48px]"
                      aria-label={`Choose ${g.items[0]}`}
                    >
                      <Icon icon="twemoji:white-check-mark" width="24" height="24" className="mr-2" aria-hidden />
                      <span className="font-bold">{g.items[0]}</span>
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => {
                        const first = g.items[0];
                        const label = first[0].toUpperCase() + first.slice(1);
                        const speech = phraseInstead(label);
                        void speak(speech);
                        interactionsApi.record({ location, promptType: "PHRASE_INSTEAD", selectedText: speech });
                      }}
                      disabled={speaking}
                      className="rounded-[18px] px-4 py-4 min-h-[48px]"
                      aria-label={`Something else instead of ${g.items[0]}`}
                    >
                      <Icon icon="twemoji:counterclockwise-arrows-button" width="24" height="24" className="mr-2" aria-hidden />
                      <span className="font-bold">Else</span>
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
