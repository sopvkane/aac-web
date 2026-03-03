import { useEffect, useMemo, useState } from "react";
import { speakText } from "../api/tts";
import { Button } from "../components/ui/button";
import { wellbeingApi } from "../api/wellbeing";
import { preferencesApi } from "../api/preferences";
import type { PreferenceItem } from "../types/preferences";

type LocationKey = "HOME" | "SCHOOL" | "OUT";

/** Timeline-aligned block: which part of the day we're in */
type TimelineBlock =
  | "SLEEPING"   // 21:00–7:30: woke up during night
  | "WAKE"       // 7:30–8:00
  | "BREAKFAST"  // 8:00–10:00
  | "MORNING"    // 10:00–12:15 (play/school, drink)
  | "LUNCH"      // 12:15–14:30
  | "AFTERNOON"  // 14:30–16:30 (mood, snack)
  | "HOME_TIME"  // 16:30–18:00
  | "DINNER"     // 18:00–19:45
  | "WIND_DOWN"; // 19:45–21:00

type FollowUpKind = "FOOD" | "DRINK" | "ACTIVITY" | "TV";

type QuickSpeakOption = {
  label: string;
  speech: string;
  icon: string;
  tone: "aac-tone-a" | "aac-tone-b" | "aac-tone-c";
  /** If set, show "who to ask" picker after tap (home only) */
  askWho?: boolean;
  /** Only show when at home */
  homeOnly?: boolean;
  /** After speaking, show follow-up options panel (e.g. pick a specific food/drink/show) */
  followUp?: FollowUpKind;
};

const BLOCK_OPTIONS: Record<TimelineBlock, QuickSpeakOption[]> = {
  SLEEPING: [
    { label: "Thirsty", speech: "I'm thirsty. Can I have some water?", icon: "🥤", tone: "aac-tone-a", askWho: true, followUp: "DRINK" },
    { label: "Too hot/cold", speech: "I'm too hot or too cold.", icon: "🌡️", tone: "aac-tone-b", askWho: true },
    { label: "Don't feel well", speech: "I don't feel well.", icon: "😔", tone: "aac-tone-c", askWho: true },
  ],
  WAKE: [
    { label: "Drink", speech: "I'd like a drink.", icon: "🥤", tone: "aac-tone-a", askWho: true, followUp: "DRINK" },
    { label: "Food", speech: "I'm hungry.", icon: "🍽️", tone: "aac-tone-b", askWho: true, followUp: "FOOD" },
    { label: "Watch TV", speech: "Can I watch something on TV?", icon: "📺", tone: "aac-tone-c", askWho: true, homeOnly: true, followUp: "TV" },
    { label: "Toilet", speech: "I need the toilet.", icon: "🚻", tone: "aac-tone-c" },
  ],
  BREAKFAST: [
    { label: "Drink", speech: "I'd like a drink.", icon: "🥤", tone: "aac-tone-a", askWho: true, followUp: "DRINK" },
    { label: "Food", speech: "I'm hungry.", icon: "🍽️", tone: "aac-tone-b", askWho: true, followUp: "FOOD" },
    { label: "Toilet", speech: "I need the toilet.", icon: "🚻", tone: "aac-tone-c" },
  ],
  MORNING: [
    { label: "Drink", speech: "I'm thirsty.", icon: "🥤", tone: "aac-tone-a", askWho: true, followUp: "DRINK" },
    { label: "Toilet", speech: "I need the toilet.", icon: "🚻", tone: "aac-tone-b" },
    { label: "Help", speech: "I need help.", icon: "🆘", tone: "aac-tone-c" },
  ],
  LUNCH: [
    { label: "Hungry", speech: "I'm hungry.", icon: "🍽️", tone: "aac-tone-a", askWho: true, followUp: "FOOD" },
    { label: "Drink", speech: "I'm thirsty.", icon: "🥤", tone: "aac-tone-b", askWho: true, followUp: "DRINK" },
    { label: "Toilet", speech: "I need the toilet.", icon: "🚻", tone: "aac-tone-c" },
  ],
  AFTERNOON: [
    { label: "Snack", speech: "I'd like a snack.", icon: "🍎", tone: "aac-tone-a", askWho: true, followUp: "FOOD" },
    { label: "Drink", speech: "I'm thirsty.", icon: "🥤", tone: "aac-tone-b", askWho: true, followUp: "DRINK" },
    { label: "Activity", speech: "Can we do something?", icon: "🧸", tone: "aac-tone-c", askWho: true, followUp: "ACTIVITY" },
  ],
  HOME_TIME: [
    { label: "Snack", speech: "I'd like a snack.", icon: "🍎", tone: "aac-tone-a", askWho: true, followUp: "FOOD" },
    { label: "Activity", speech: "Can we do something?", icon: "🧸", tone: "aac-tone-b", askWho: true, followUp: "ACTIVITY" },
    { label: "Drink", speech: "I'm thirsty.", icon: "🥤", tone: "aac-tone-c", askWho: true, followUp: "DRINK" },
  ],
  DINNER: [
    { label: "Hungry", speech: "I'm hungry.", icon: "🍽️", tone: "aac-tone-a", askWho: true, followUp: "FOOD" },
    { label: "What's for dinner?", speech: "What's for dinner?", icon: "🍲", tone: "aac-tone-b", askWho: true, followUp: "FOOD" },
    { label: "Drink", speech: "I'd like a drink.", icon: "🥤", tone: "aac-tone-c", askWho: true, followUp: "DRINK" },
  ],
  WIND_DOWN: [
    { label: "Watch TV", speech: "Can I watch something on TV?", icon: "📺", tone: "aac-tone-a", askWho: true, homeOnly: true, followUp: "TV" },
    { label: "Drink", speech: "I'd like a drink.", icon: "🥤", tone: "aac-tone-b", askWho: true, followUp: "DRINK" },
    { label: "Toilet", speech: "I need the toilet.", icon: "🚻", tone: "aac-tone-c" },
  ],
};

function currentTimelineBlock(): TimelineBlock {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const min = h * 60 + m;
  // bed at 21:00 = 1260, wake at 7:30 = 450
  if (min >= 1260 || min < 450) return "SLEEPING";
  if (min < 480) return "WAKE";         // 8:00
  if (min < 630) return "BREAKFAST";    // 10:30
  if (min < 735) return "MORNING";      // 12:15
  if (min < 870) return "LUNCH";        // 14:30
  if (min < 990) return "AFTERNOON";   // 16:30
  if (min < 1080) return "HOME_TIME";   // 18:00
  if (min < 1185) return "DINNER";      // 19:45
  return "WIND_DOWN";                    // 21:00
}

function optionsForBlock(block: TimelineBlock, location: LocationKey): QuickSpeakOption[] {
  const opts = BLOCK_OPTIONS[block];
  const filtered = opts.filter((o) => !o.homeOnly || location === "HOME");
  return filtered.slice(0, 3);
}

const BLOCK_LABELS: Record<TimelineBlock, string> = {
  SLEEPING: "Night (if you wake up)",
  WAKE: "Wake up",
  BREAKFAST: "Breakfast",
  MORNING: "Morning",
  LUNCH: "Lunch",
  AFTERNOON: "Afternoon",
  HOME_TIME: "Home time",
  DINNER: "Dinner",
  WIND_DOWN: "Wind down",
};

/** Map timeline item id → block for testing (tap to preview options) */
const TIMELINE_ITEM_TO_BLOCK: Record<string, TimelineBlock> = {
  wake: "WAKE",
  breakfast: "BREAKFAST",
  play: "BREAKFAST",
  school: "BREAKFAST",
  drink: "MORNING",
  lunch: "LUNCH",
  mood: "AFTERNOON",
  snack: "AFTERNOON",
  home: "HOME_TIME",
  dinner: "DINNER",
  winddown: "WIND_DOWN",
  bed: "SLEEPING",
};

type TimelineItem = {
  id: string;
  hour: number;
  minute: number;
  title: string;
  subtitle?: string;
  icon: string;
};

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function minutesSinceMidnight(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

function formatTime(hour: number, minute: number) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function TodayTimeline({
  location,
  onBlockSelect,
  testBlock,
}: {
  location: LocationKey;
  onBlockSelect?: (block: TimelineBlock) => void;
  testBlock?: TimelineBlock | null;
}) {
  const now = new Date();
  const nowMin = minutesSinceMidnight(now);
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  const items: TimelineItem[] = [
    { id: "wake", hour: 7, minute: 30, title: "Wake up", subtitle: "Start the day", icon: "🌅" },
    { id: "breakfast", hour: 8, minute: 0, title: "Breakfast", subtitle: "Food + drink", icon: "🍳" },
    ...(location === "SCHOOL" && !isWeekend
      ? [{ id: "school", hour: 9, minute: 0, title: "School", subtitle: "Class time", icon: "🎒" }]
      : [{ id: "play", hour: 10, minute: 0, title: "Play time", subtitle: "Activity", icon: "🧸" }]),
    { id: "drink", hour: 10, minute: 30, title: "Drink break", subtitle: "Hydration", icon: "🥤" },
    { id: "lunch", hour: 12, minute: 15, title: "Lunch", subtitle: "Food + drink", icon: "🥪" },
    { id: "mood", hour: 14, minute: 30, title: "Feelings check", subtitle: "Mood check‑in", icon: "🙂" },
    { id: "snack", hour: 15, minute: 45, title: "Snack", subtitle: "Small bite", icon: "🍎" },
    { id: "home", hour: 16, minute: 30, title: "Home time", subtitle: "Transition", icon: "🏠" },
    { id: "dinner", hour: 18, minute: 0, title: "Dinner", subtitle: "Food + drink", icon: "🍽️" },
    { id: "winddown", hour: 19, minute: 45, title: "Wind down", subtitle: "Quiet activity", icon: "📺" },
    { id: "bed", hour: 21, minute: 0, title: "Bedtime", subtitle: "Sleep", icon: "🛏️" },
  ];

  const itemMinutes = items.map((it) => it.hour * 60 + it.minute);
  const nextIdx = itemMinutes.findIndex((m) => m >= nowMin);
  const nextItem = nextIdx >= 0 ? items[nextIdx] : null;

  const stateFor = (it: TimelineItem, idx: number) => {
    const m = it.hour * 60 + it.minute;
    const diff = m - nowMin;
    if (Math.abs(diff) <= 20) return "now";
    if (idx === nextIdx) return "next";
    if (m < nowMin) return "past";
    return "upcoming";
  };

  return (
    <aside className="space-y-3 md:space-y-4 md:sticky md:top-24">
      <div className="aac-panel rounded-3xl p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Today
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Timeline</h2>
            <p className="mt-1 text-xs text-slate-600">
              What’s next, and what has already happened today. Tap any item to preview its options.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600">
            {pad2(now.getDate())}/{pad2(now.getMonth() + 1)}
          </div>
        </div>

        {nextItem && (
          <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
              Next up
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden="true">
                  {nextItem.icon}
                </span>
                <div className="font-bold text-slate-900">{nextItem.title}</div>
              </div>
              <div className="text-xs font-semibold text-slate-700">
                {formatTime(nextItem.hour, nextItem.minute)}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-2 overscroll-contain">
          {items.map((it, idx) => {
            const state = stateFor(it, idx) as "past" | "now" | "next" | "upcoming";
            const blockForItem = TIMELINE_ITEM_TO_BLOCK[it.id];
            const isTestSelected = onBlockSelect && testBlock && blockForItem === testBlock;
            const dotClass =
              isTestSelected
                ? "bg-amber-500 ring-2 ring-amber-300 ring-offset-1"
                : state === "now"
                  ? "bg-emerald-500"
                  : state === "next"
                    ? "bg-indigo-500"
                    : state === "past"
                      ? "bg-slate-300"
                      : "bg-slate-200";
            const cardClass =
              isTestSelected
                ? "border-amber-300 bg-amber-50 ring-2 ring-amber-200"
                : state === "now"
                  ? "border-emerald-200 bg-emerald-50"
                  : state === "next"
                    ? "border-indigo-200 bg-indigo-50"
                    : state === "past"
                      ? "border-slate-200 bg-white"
                      : "border-slate-200 bg-white";
            const titleClass = state === "past" && !isTestSelected ? "text-slate-500" : "text-slate-900";

            return (
              <div key={it.id} className="flex items-stretch gap-3">
                <div className="flex flex-col items-center">
                  <div className={`mt-2 h-3 w-3 rounded-full ${dotClass}`} />
                  {idx < items.length - 1 && <div className="mt-2 w-px flex-1 bg-slate-200" />}
                </div>
                <button
                  type="button"
                  onClick={() => blockForItem && onBlockSelect?.(blockForItem)}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-left transition-colors ${cardClass} ${onBlockSelect ? "cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50" : ""}`}
                  title={blockForItem ? `Preview ${BLOCK_LABELS[blockForItem]} options` : undefined}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-base leading-none" aria-hidden="true">
                        {it.icon}
                      </span>
                      <div>
                        <div className={`text-sm font-bold ${titleClass}`}>{it.title}</div>
                        {it.subtitle && (
                          <div className="text-xs font-semibold text-slate-500 mt-0.5">
                            {it.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-slate-600">
                      {formatTime(it.hour, it.minute)}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

const WELLBEING_SLOT_MORNING = { start: 7, end: 9 };   // 7–9am
const WELLBEING_SLOT_BED = { start: 20, end: 22 };    // 8–10pm

function isInWellbeingSlot(): "morning" | "bed" | null {
  const h = new Date().getHours();
  if (h >= WELLBEING_SLOT_MORNING.start && h < WELLBEING_SLOT_MORNING.end) return "morning";
  if (h >= WELLBEING_SLOT_BED.start && h < WELLBEING_SLOT_BED.end) return "bed";
  return null;
}

function wellbeingPopupKey(slot: "morning" | "bed"): string {
  const d = new Date();
  return `wellbeing_${slot}_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const UNCOUNTABLE_FOODS = new Set(["pasta", "rice", "toast", "bread", "fruit", "cereal", "yogurt", "soup", "juice", "water", "milk", "tea"]);
function foodArticle(label: string): string {
  const lower = label.toLowerCase();
  if (UNCOUNTABLE_FOODS.has(lower) || lower.endsWith("juice") || lower.endsWith("water")) return "some";
  const first = lower.charAt(0);
  return /[aeiou]/.test(first) ? "an" : "a";
}

const MOOD_OPTIONS = [
  { score: 5, label: "Happy", icon: "🙂", speech: "I'm happy.", tone: "aac-tone-c" as const },
  { score: 2, label: "Sad", icon: "🙁", speech: "I'm sad.", tone: "aac-tone-b" as const },
  { score: 3, label: "Not sure", icon: "🤔", speech: "I feel funny.", tone: "aac-tone-a" as const },
] as const;

export function SpeakPage({ location }: { location: LocationKey }) {
  const block = useMemo(() => currentTimelineBlock(), []);
  const [testBlock, setTestBlock] = useState<TimelineBlock | null>(null);
  const displayBlock = testBlock ?? block;
  const [family, setFamily] = useState<PreferenceItem[]>([]);
  const [showPainModal, setShowPainModal] = useState(false);
  const [painTap, setPainTap] = useState<{ xPct: number; yPct: number } | null>(null);
  const [whoToAsk, setWhoToAsk] = useState<{ option: QuickSpeakOption; speech: string } | null>(null);
  const [showWellbeingPopup, setShowWellbeingPopup] = useState(() => {
    const slot = isInWellbeingSlot();
    if (!slot) return false;
    return !localStorage.getItem(wellbeingPopupKey(slot));
  });
  const [followUpPanel, setFollowUpPanel] = useState<FollowUpKind | null>(null);
  const [foods, setFoods] = useState<PreferenceItem[]>([]);
  const [drinks, setDrinks] = useState<PreferenceItem[]>([]);
  const [activities, setActivities] = useState<PreferenceItem[]>([]);

  const speak = async (text: string) => {
    await speakText(text);
  };

  const dismissWellbeingPopup = () => {
    const slot = isInWellbeingSlot();
    if (slot) localStorage.setItem(wellbeingPopupKey(slot), "1");
    setShowWellbeingPopup(false);
  };

  const openFollowUpIfNeeded = (opt: QuickSpeakOption) => {
    if (opt.followUp) setFollowUpPanel(opt.followUp);
  };

  const handleOptionTap = (opt: QuickSpeakOption) => {
    const shouldAskWho = opt.askWho && location === "HOME" && family.length > 0;
    if (shouldAskWho) {
      setWhoToAsk({ option: opt, speech: opt.speech });
    } else {
      void speak(opt.speech).then(() => openFollowUpIfNeeded(opt));
    }
  };

  const handleWhoSelected = (person: PreferenceItem, baseSpeech: string, opt: QuickSpeakOption) => {
    const msg = `${person.label}, ${baseSpeech.toLowerCase()}`;
    void speak(msg).then(() => openFollowUpIfNeeded(opt));
    setWhoToAsk(null);
  };

  const classifyPainTap = (x: number, y: number) => {
    // x,y are normalized 0..1 within the image container.
    // Heuristics are intentionally simple so a child can tap anywhere.
    // We return a stable `bodyArea` string for analytics + a natural `speech` phrase.
    const isLeft = x < 0.5;
    const isOuter = x <= 0.28 || x >= 0.72;

    // Head
    if (y < 0.22) {
      return { bodyArea: "HEAD", speech: "My head hurts." };
    }

    // Arms / elbows / hands (outer columns)
    if (isOuter) {
      const side = isLeft ? "LEFT" : "RIGHT";

      if (y < 0.45) {
        return { bodyArea: `${side}_ARM`, speech: `My ${isLeft ? "left" : "right"} arm hurts.` };
      }
      if (y < 0.60) {
        return {
          bodyArea: `${side}_ELBOW`,
          speech: `My ${isLeft ? "left" : "right"} elbow hurts.`,
        };
      }
      if (y < 0.72) {
        return {
          bodyArea: `${side}_HAND`,
          speech: `My ${isLeft ? "left" : "right"} hand hurts.`,
        };
      }
    }

    // Chest / tummy / legs / knees (center column)
    if (y < 0.42) {
      return { bodyArea: "CHEST", speech: "My chest hurts." };
    }
    if (y < 0.64) {
      return { bodyArea: "TUMMY", speech: "My tummy hurts." };
    }
    if (y < 0.84) {
      return { bodyArea: isLeft ? "LEFT_KNEE" : "RIGHT_KNEE", speech: "My knee hurts." };
    }
    return { bodyArea: isLeft ? "LEFT_LEG" : "RIGHT_LEG", speech: "My leg hurts." };
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [fam, foodList, drinkList, actList] = await Promise.all([
          preferencesApi.list("FAMILY_MEMBER"),
          preferencesApi.list("FOOD"),
          preferencesApi.list("DRINK"),
          preferencesApi.list("ACTIVITY"),
        ]);
        if (!cancelled) {
          setFamily(fam);
          setFoods(foodList);
          setDrinks(drinkList);
          setActivities(actList);
        }
      } catch {
        // ignore
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const quickSpeakOptions = useMemo(
    () => optionsForBlock(displayBlock, location),
    [displayBlock, location]
  );

  const filteredFoods = useMemo(
    () => foods.filter((f) => f.scope === location || f.scope === "BOTH"),
    [foods, location]
  );
  const filteredDrinks = useMemo(
    () => drinks.filter((d) => d.scope === location || d.scope === "BOTH"),
    [drinks, location]
  );
  const filteredActivities = useMemo(
    () => activities.filter((a) => a.scope === location || a.scope === "BOTH"),
    [activities, location]
  );
  const filteredTvShows = useMemo(
    () => filteredActivities.filter((a) => a.category === "TV_SHOW"),
    [filteredActivities]
  );

  const handleBlockSelect = (b: TimelineBlock) => {
    setTestBlock((prev) => (prev === b ? null : b));
  };
  const timeLabel = useMemo(
    () =>
      new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    []
  );

  return (
    <div className="w-full">
      <div className="grid gap-6 md:grid-cols-[320px_1fr] md:items-start">
        <TodayTimeline
          location={location}
          onBlockSelect={handleBlockSelect}
          testBlock={testBlock}
        />

        <main className="space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Quick speak
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Tap to speak</h1>
              <p className="text-sm text-slate-600 max-w-xl">
                Big, simple buttons for common needs. These change with the time of day and where
                you are.
              </p>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 font-semibold">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs">
                  ●
                </span>
                {location === "HOME"
                  ? "At home"
                  : location === "SCHOOL"
                    ? "At school"
                    : "Out & about"}
              </span>
              <span className="text-[11px] text-slate-500">
                It&apos;s {timeLabel} — {BLOCK_LABELS[displayBlock].toLowerCase()}
                {testBlock && (
                  <button
                    type="button"
                    onClick={() => setTestBlock(null)}
                    className="ml-1 text-amber-600 hover:text-amber-700 underline"
                  >
                    (reset)
                  </button>
                )}
              </span>
              <button
                type="button"
                onClick={() => setShowPainModal(true)}
                className="mt-1 inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
              >
                <span aria-hidden="true">⚠️</span> I feel pain / Help
              </button>
            </div>
          </header>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">
              {BLOCK_LABELS[displayBlock]}
              {testBlock && (
                <span className="ml-2 text-amber-600 text-xs font-normal">
                  (preview)
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-600">
              Quick options for this part of the day.
              {testBlock
                ? " Tap another timeline item to preview, or reset to actual time."
                : " Tap any timeline item to preview its options."}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {quickSpeakOptions.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleOptionTap(opt)}
                  className={`aac-tile ${opt.tone}`}
                >
                  <div className="aac-tile-top">
                    <div className="aac-tile-label">{opt.label}</div>
                    <span className="aac-letter" aria-hidden="true">
                      {opt.icon}
                    </span>
                  </div>
                  <div className="aac-tile-speech">{opt.speech}</div>
                </button>
              ))}
            </div>
          </section>

          {family.length > 0 && location === "HOME" && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-800">Who is at home?</h2>
              <p className="text-xs text-slate-600">
                For some needs above, you can pick who to ask after tapping.
              </p>
              <div className="flex flex-wrap gap-2">
                {family.map((person) => (
                  <span
                    key={person.id}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-pink-100 text-pink-700 text-xs">
                      {person.label.charAt(0).toUpperCase()}
                    </span>
                    {person.label}
                  </span>
                ))}
              </div>
            </section>
          )}

          {followUpPanel && (
            <section className="aac-panel rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-800">
                  {followUpPanel === "FOOD" && "What would you like to eat?"}
                  {followUpPanel === "DRINK" && "What would you like to drink?"}
                  {followUpPanel === "TV" && "What would you like to watch?"}
                  {followUpPanel === "ACTIVITY" && "What would you like to do?"}
                </h2>
                <button
                  type="button"
                  onClick={() => setFollowUpPanel(null)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Close
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(followUpPanel === "FOOD" ? filteredFoods : followUpPanel === "DRINK" ? filteredDrinks : followUpPanel === "TV" ? filteredTvShows : filteredActivities).map((item) => {
                  const label = item.label;
                  const lower = label.toLowerCase();
                  const speech =
                    followUpPanel === "FOOD"
                      ? `Could I have ${foodArticle(label)} ${lower}, please?`
                      : followUpPanel === "DRINK"
                        ? `Could I have some ${lower}, please?`
                        : followUpPanel === "TV"
                          ? `I would like to watch ${label}, please.`
                          : `I would like to ${lower}, please.`;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void speak(speech)}
                      className="aac-tile flex items-center gap-2 py-3 px-4 rounded-2xl border-2 transition-transform active:scale-95 hover:scale-[1.02]"
                      aria-label={speech}
                    >
                      <span className="font-bold text-sm">{label}</span>
                    </button>
                  );
                })}
              </div>
              {((followUpPanel === "FOOD" && filteredFoods.length === 0) ||
                (followUpPanel === "DRINK" && filteredDrinks.length === 0) ||
                (followUpPanel === "ACTIVITY" && filteredActivities.length === 0) ||
                (followUpPanel === "TV" && filteredTvShows.length === 0)) && (
                <p className="text-xs text-slate-500">
                  No options configured yet. Ask a carer to add some in Settings.
                </p>
              )}
            </section>
          )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Pain</h2>
        <p className="text-xs text-slate-500">
          Tap the red help button at the top at any time to say where it hurts.
        </p>
      </section>

      {whoToAsk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setWhoToAsk(null)}
              className="absolute right-4 top-4 text-sm text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
            <h2 className="mb-2 text-lg font-bold text-slate-900">Who do you want to ask?</h2>
            <p className="mb-4 text-sm text-slate-600">
              Tap who you&apos;d like to ask for: {whoToAsk.option.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {family.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => handleWhoSelected(person, whoToAsk.speech, whoToAsk.option)}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-indigo-300 hover:bg-indigo-100"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-pink-700">
                    {person.label.charAt(0).toUpperCase()}
                  </span>
                  {person.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => {
                void speak(whoToAsk.speech).then(() => openFollowUpIfNeeded(whoToAsk.option));
                setWhoToAsk(null);
              }}
            >
              Just say it (no name)
            </Button>
          </div>
        </div>
      )}

      {showWellbeingPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-bold text-slate-900">How are you feeling?</h2>
            <p className="mb-4 text-sm text-slate-600">
              {isInWellbeingSlot() === "morning"
                ? "Good morning! Quick check-in."
                : "Almost bedtime. How do you feel?"}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {MOOD_OPTIONS.map((m) => (
                <Button
                  key={m.score}
                  type="button"
                  onClick={async () => {
                    await wellbeingApi.recordMood(m.score);
                    await speak(m.speech);
                    dismissWellbeingPopup();
                  }}
                  className={`aac-tile ${m.tone} h-auto flex-col py-4`}
                >
                  <span className="text-3xl" aria-hidden="true">
                    {m.icon}
                  </span>
                  <span className="mt-2 text-sm font-bold">{m.label}</span>
                </Button>
              ))}
            </div>
            <button
              type="button"
              onClick={dismissWellbeingPopup}
              className="mt-4 text-sm text-slate-500 hover:text-slate-700"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {showPainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowPainModal(false)}
              className="absolute right-4 top-4 text-sm text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
            <h2 className="mb-2 text-lg font-bold text-slate-900">Where does it hurt?</h2>
            <p className="mb-4 text-sm text-slate-600">
              Tap on the picture where it hurts, or press &quot;Help now&quot;.
            </p>

            <div className="mx-auto flex w-full max-w-[300px] items-center justify-center">
              <div
                className="relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                onClick={async (e) => {
                  const el = e.currentTarget;
                  const rect = el.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / rect.width;
                  const y = (e.clientY - rect.top) / rect.height;

                  const xPct = Math.max(0, Math.min(100, x * 100));
                  const yPct = Math.max(0, Math.min(100, y * 100));
                  setPainTap({ xPct, yPct });

                  const { bodyArea, speech } = classifyPainTap(x, y);
                  await wellbeingApi.recordPain(
                    bodyArea,
                    5,
                    `tap=${x.toFixed(2)},${y.toFixed(2)} area=${bodyArea}`
                  );
                  await speak(speech);
                  setShowPainModal(false);
                }}
                role="button"
                aria-label="Tap the body where it hurts"
              >
                <img
                  src="https://media.istockphoto.com/id/1331743543/vector/cute-beautiful-little-girl-is-standing-and-smiling-funny-child-with-pigtails-in-shorts-and-a.jpg?s=612x612&w=0&k=20&c=9jAF0jgISBhsdEOQsIOyhNr2jugxHCfGXNI8VZPc6cQ="
                  alt="Cartoon body"
                  className="block w-full select-none"
                  draggable={false}
                />
                {painTap && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${painTap.xPct}%`,
                      top: `${painTap.yPct}%`,
                      width: 22,
                      height: 22,
                      background: "rgba(244,63,94,0.25)",
                      border: "2px solid rgba(244,63,94,0.9)",
                      boxShadow: "0 0 0 6px rgba(244,63,94,0.12)",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-between gap-3">
              <Button
                type="button"
                variant="destructive"
                onClick={async () => {
                  await wellbeingApi.recordPain("UNKNOWN", 7, "Help now button");
                  await speak("I need help now.");
                  setShowPainModal(false);
                }}
              >
                Help now
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowPainModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
}

