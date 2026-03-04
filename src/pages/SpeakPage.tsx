import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Home, GraduationCap, Bus, MapPin } from "lucide-react";
import { speakText } from "../api/tts";
import { profileApi } from "../api/profile";
import { Button } from "../components/ui/button";
import { wellbeingApi } from "../api/wellbeing";
import { preferencesApi } from "../api/preferences";
import { interactionsApi } from "../api/interactions";
import type { PreferenceItem } from "../types/preferences";

type LocationKey = "HOME" | "SCHOOL" | "OUT";

/** Fallback icon for follow-up items when imageUrl is not set. Twemoji for clarity. */
function fallbackIconForLabel(label: string, kind: FollowUpKind): string | null {
  const t = label.trim().toLowerCase();
  if (kind === "DRINK") {
    if (t.includes("water")) return "twemoji:droplet";
    if (t.includes("juice") || t.includes("apple")) return "twemoji:cup-with-straw";
    if (t.includes("milk")) return "twemoji:glass-of-milk";
    if (t.includes("tea")) return "twemoji:teacup-without-handle";
    if (t.includes("coffee")) return "twemoji:hot-beverage";
    if (t.includes("cola") || t.includes("fizzy")) return "twemoji:cup-with-straw";
    return "twemoji:cup-with-straw";
  }
  if (kind === "FOOD") {
    if (t.includes("apple")) return "twemoji:red-apple";
    if (t.includes("banana")) return "twemoji:banana";
    if (t.includes("toast") || t.includes("bread")) return "twemoji:bread";
    if (t.includes("sandwich")) return "twemoji:sandwich";
    if (t.includes("pizza")) return "twemoji:slice-of-pizza";
    if (t.includes("cereal")) return "twemoji:bowl-with-spoon";
    if (t.includes("fruit")) return "twemoji:grapes";
    return "twemoji:plate-with-cutlery";
  }
  if (kind === "TV") {
    if (t.includes("bluey")) return "twemoji:dog-face";
    if (t.includes("peppa") || t.includes("pig")) return "twemoji:pig-face";
    if (t.includes("cocomelon")) return "twemoji:melon";
    return "twemoji:television";
  }
  if (kind === "ACTIVITY") {
    if (t.includes("play") || t.includes("game")) return "twemoji:game-die";
    if (t.includes("outside") || t.includes("park")) return "twemoji:sun";
    if (t.includes("book")) return "twemoji:open-book";
    if (t.includes("ipad") || t.includes("tablet")) return "twemoji:mobile-phone";
    return "twemoji:video-game";
  }
  return null;
}

/** Effective location derived from time of day (includes bus during commute) */
export type EffectiveLocation = "HOME" | "SCHOOL" | "BUS" | "OUT";

/** Timeline-aligned block: which part of the day we're in */
type TimelineBlock =
  | "SLEEPING"   // 21:00–7:30: woke up during night
  | "WAKE"       // 7:30–8:00
  | "BREAKFAST"  // 8:00–10:00
  | "MORNING"    // 10:00–12:15 (play/school)
  | "DRINK_BREAK"  // 10:30 drink break (different from class)
  | "LUNCH"      // 12:15–14:30
  | "AFTERNOON"  // 14:30–16:30 (mood, snack)
  | "HOME_TIME"  // 16:30–18:00
  | "DINNER"     // 18:00–19:45
  | "WIND_DOWN"  // 19:45–21:00
  | "BUS";       // 8:00–9:00 or 15:30–16:30 (school days, commute)

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
  /** Only show when at school */
  schoolOnly?: boolean;
  /** Only show when on bus */
  busOnly?: boolean;
  /** After speaking, show follow-up options panel (e.g. pick a specific food/drink/show) */
  followUp?: FollowUpKind;
  /** If set, record mood to wellbeing API when tapped (Feelings check) */
  moodScore?: number;
};

const BLOCK_OPTIONS: Record<TimelineBlock, QuickSpeakOption[]> = {
  SLEEPING: [
    { label: "Thirsty", speech: "I'm thirsty. Can I have a drink?", icon: "🥤", tone: "aac-tone-a", askWho: true, followUp: "DRINK" },
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
    { label: "Play idea", speech: "Can we do something fun?", icon: "🧸", tone: "aac-tone-a", askWho: true, homeOnly: true, followUp: "ACTIVITY" },
    { label: "Thirsty", speech: "I'm thirsty.", icon: "🥤", tone: "aac-tone-b", askWho: true, homeOnly: true, followUp: "DRINK" },
    { label: "Toilet", speech: "I need the toilet.", icon: "🚻", tone: "aac-tone-c", homeOnly: true },
    { label: "Water", speech: "Can I have some water?", icon: "💧", tone: "aac-tone-a", schoolOnly: true, askWho: true },
    { label: "Toilet", speech: "I need the toilet.", icon: "🚻", tone: "aac-tone-b", schoolOnly: true, askWho: true },
    { label: "Help", speech: "I need help.", icon: "🆘", tone: "aac-tone-c", schoolOnly: true, askWho: true },
  ],
  DRINK_BREAK: [
    { label: "Water", speech: "Can I have some water?", icon: "💧", tone: "aac-tone-a", schoolOnly: true, askWho: true },
    { label: "Different drink", speech: "Can I have a different drink?", icon: "🥤", tone: "aac-tone-b", schoolOnly: true, askWho: true, followUp: "DRINK" },
    { label: "I'm finished", speech: "I'm finished, thank you.", icon: "👍", tone: "aac-tone-c", schoolOnly: true },
    { label: "Water", speech: "Can I have some water?", icon: "💧", tone: "aac-tone-a", homeOnly: true, askWho: true },
    { label: "Different drink", speech: "Can I have a different drink?", icon: "🥤", tone: "aac-tone-b", homeOnly: true, askWho: true, followUp: "DRINK" },
    { label: "I'm finished", speech: "I'm finished, thank you.", icon: "👍", tone: "aac-tone-c", homeOnly: true },
  ],
  LUNCH: [
    { label: "Hungry", speech: "I'm hungry.", icon: "🍽️", tone: "aac-tone-a", askWho: true, followUp: "FOOD" },
    { label: "I'm full", speech: "I'm full, thank you.", icon: "🙂", tone: "aac-tone-b" },
    { label: "Drink", speech: "I'd like a drink.", icon: "🥤", tone: "aac-tone-c", askWho: true, followUp: "DRINK" },
  ],
  AFTERNOON: [
    { label: "Snack", speech: "I'd like a snack.", icon: "🍎", tone: "aac-tone-a", askWho: true, homeOnly: true, followUp: "FOOD" },
    { label: "Activity", speech: "Can we do something?", icon: "🧸", tone: "aac-tone-b", askWho: true, homeOnly: true, followUp: "ACTIVITY" },
    { label: "Go outside", speech: "Can we go outside?", icon: "🌿", tone: "aac-tone-c", askWho: true, homeOnly: true },
    { label: "Water", speech: "Can I have some water?", icon: "💧", tone: "aac-tone-a", schoolOnly: true, askWho: true },
    { label: "Toilet", speech: "I need the toilet.", icon: "🚻", tone: "aac-tone-b", schoolOnly: true, askWho: true },
    { label: "Help", speech: "I need help.", icon: "🆘", tone: "aac-tone-c", schoolOnly: true, askWho: true },
  ],
  BUS: [
    { label: "Feel sick", speech: "I don't feel well.", icon: "😟", tone: "aac-tone-a", askWho: true },
    { label: "Need toilet", speech: "I need the toilet. Can we stop?", icon: "🚻", tone: "aac-tone-b", askWho: true },
    { label: "Thirsty", speech: "I'm thirsty.", icon: "🥤", tone: "aac-tone-c", askWho: true, followUp: "DRINK" },
  ],
  HOME_TIME: [
    { label: "Snack", speech: "I'd like a snack.", icon: "🍎", tone: "aac-tone-a", askWho: true, followUp: "FOOD" },
    { label: "Tell you", speech: "I want to tell you about my day.", icon: "💬", tone: "aac-tone-b", askWho: true },
    { label: "Activity", speech: "Can we do something?", icon: "🧸", tone: "aac-tone-c", askWho: true, followUp: "ACTIVITY" },
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

/** Mon–Fri = school days (0=Sun, 6=Sat) */
function isSchoolDay(): boolean {
  const d = new Date().getDay();
  return d >= 1 && d <= 5;
}

function currentTimelineBlock(): TimelineBlock {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const min = h * 60 + m;
  const schoolDay = isSchoolDay();
  // Bus to school 8:00–9:00 (480–540), bus home 15:30–16:30 (930–990)
  if (schoolDay && min >= 480 && min < 540) return "BUS";
  if (schoolDay && min >= 930 && min < 990) return "BUS";
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

/** Derive effective location from time of day (school days: bus 8–9, school 9–15:30, bus 15:30–16:30) */
function deriveEffectiveLocation(manualLocation?: LocationKey): EffectiveLocation {
  if (manualLocation === "OUT") return "OUT";
  const min = new Date().getHours() * 60 + new Date().getMinutes();
  const schoolDay = isSchoolDay();
  if (schoolDay && min >= 480 && min < 540) return "BUS";   // 8:00–9:00 to school
  if (schoolDay && min >= 540 && min < 930) return "SCHOOL"; // 9:00–15:30
  if (schoolDay && min >= 930 && min < 990) return "BUS";   // 15:30–16:30 from school
  return manualLocation === "SCHOOL" ? "SCHOOL" : "HOME";
}

function optionsForBlock(
  block: TimelineBlock,
  effectiveLocation: EffectiveLocation,
  maxOptions: number = 3
): QuickSpeakOption[] {
  const opts = BLOCK_OPTIONS[block] ?? [];
  const filtered = opts.filter((o) => {
    if (o.homeOnly && effectiveLocation !== "HOME") return false;
    if (o.schoolOnly && effectiveLocation !== "SCHOOL") return false;
    if (o.busOnly && effectiveLocation !== "BUS") return false;
    return true;
  });
  return filtered.slice(0, Math.max(1, maxOptions));
}

const BLOCK_LABELS: Record<TimelineBlock, string> = {
  SLEEPING: "Night (if you wake up)",
  WAKE: "Wake up",
  BREAKFAST: "Breakfast",
  MORNING: "Morning",
  DRINK_BREAK: "Drink break",
  LUNCH: "Lunch",
  AFTERNOON: "Afternoon",
  BUS: "On the bus",
  HOME_TIME: "Home time",
  DINNER: "Dinner",
  WIND_DOWN: "Wind down",
};

/** Map timeline item id → block for testing (tap to preview options) */
const TIMELINE_ITEM_TO_BLOCK: Record<string, TimelineBlock> = {
  wake: "WAKE",
  breakfast: "BREAKFAST",
  play: "BREAKFAST",
  school: "MORNING",
  busTo: "BUS",
  busFrom: "BUS",
  drink: "DRINK_BREAK",
  lunch: "LUNCH",
  mood: "AFTERNOON",
  snack: "AFTERNOON",
  home: "HOME_TIME",
  dinner: "DINNER",
  winddown: "WIND_DOWN",
  bed: "SLEEPING",
};

/** When previewing a block, which location to show (so people + badge match the block) */
const LOCATION_FOR_BLOCK: Record<TimelineBlock, EffectiveLocation> = {
  SLEEPING: "HOME",
  WAKE: "HOME",
  BREAKFAST: "HOME",
  MORNING: "SCHOOL",
  DRINK_BREAK: "SCHOOL",
  LUNCH: "SCHOOL",
  AFTERNOON: "SCHOOL",
  BUS: "BUS",
  HOME_TIME: "HOME",
  DINNER: "HOME",
  WIND_DOWN: "HOME",
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
  location: _location,
  onItemSelect,
  testTimelineItemId,
}: {
  location: LocationKey;
  onItemSelect?: (itemId: string, block: TimelineBlock) => void;
  testTimelineItemId?: string | null;
}) {
  const now = new Date();
  const nowMin = minutesSinceMidnight(now);
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  const items: TimelineItem[] = [
    { id: "wake", hour: 7, minute: 30, title: "Wake up", subtitle: "Start the day", icon: "🌅" },
    { id: "breakfast", hour: 8, minute: 0, title: "Breakfast", subtitle: "Food + drink", icon: "🍳" },
    ...(!isWeekend
      ? [
          { id: "busTo", hour: 8, minute: 15, title: "Bus to school", subtitle: "On the bus", icon: "🚌" },
          { id: "school", hour: 9, minute: 0, title: "School", subtitle: "Class time", icon: "🎒" },
        ]
      : [{ id: "play", hour: 10, minute: 0, title: "Play time", subtitle: "Activity", icon: "🧸" }]),
    { id: "drink", hour: 10, minute: 30, title: "Drink break", subtitle: "Hydration", icon: "🥤" },
    { id: "lunch", hour: 12, minute: 15, title: "Lunch", subtitle: "Food + drink", icon: "🥪" },
    { id: "mood", hour: 14, minute: 30, title: "Feelings check", subtitle: "Mood check‑in", icon: "🙂" },
    { id: "snack", hour: 15, minute: 45, title: "Snack", subtitle: "Small bite", icon: "🍎" },
    ...(!isWeekend
      ? [{ id: "busFrom", hour: 16, minute: 0, title: "Bus home", subtitle: "On the bus", icon: "🚌" }]
      : []),
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
            const isTestSelected = onItemSelect && testTimelineItemId === it.id;
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
                  onClick={() => blockForItem && onItemSelect?.(it.id, blockForItem)}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-left transition-colors ${cardClass} ${onItemSelect ? "cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50" : ""}`}
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

/** Three emotions for wellbeing popup (morning/bed) and Feelings check. Scores match carer dashboard MOOD_CONFIG. */
const MOOD_OPTIONS = [
  { score: 5, label: "Happy", icon: "🙂", speech: "I'm happy.", tone: "aac-tone-c" as const },
  { score: 2, label: "Sad", icon: "🙁", speech: "I'm sad.", tone: "aac-tone-b" as const },
  { score: 3, label: "Not sure", icon: "🤔", speech: "I feel funny.", tone: "aac-tone-a" as const },
] as const;

export function SpeakPage({ location: manualLocation }: { location?: LocationKey }) {
  const effectiveLocation = useMemo(
    () => deriveEffectiveLocation(manualLocation),
    [manualLocation]
  );
  const block = useMemo(() => currentTimelineBlock(), []);
  const [testTimelineItemId, setTestTimelineItemId] = useState<string | null>(null);
  const displayBlock = testTimelineItemId
    ? (TIMELINE_ITEM_TO_BLOCK[testTimelineItemId] ?? block)
    : block;
  /** When previewing a block, use that block's location; otherwise use time-derived */
  const displayLocation = testTimelineItemId ? LOCATION_FOR_BLOCK[displayBlock] : effectiveLocation;
  const [family, setFamily] = useState<PreferenceItem[]>([]);
  const [schoolPeople, setSchoolPeople] = useState<PreferenceItem[]>([]);
  const [showPainModal, setShowPainModal] = useState(false);
  const [painTap, setPainTap] = useState<{ xPct: number; yPct: number } | null>(null);
  const [painSelectedArea, setPainSelectedArea] = useState<{
    bodyArea: string;
    bodyPartLabel: string;
    icon: string;
  } | null>(null);
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
  const [busStaff, setBusStaff] = useState<PreferenceItem[]>([]);
  const [maxOptions, setMaxOptions] = useState(3);

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

  const peopleForContext = displayLocation === "HOME" ? family : displayLocation === "SCHOOL" ? schoolPeople : displayLocation === "BUS" ? busStaff : [];
  const handleOptionTap = (opt: QuickSpeakOption) => {
    if (opt.moodScore != null) {
      void wellbeingApi.recordMood(opt.moodScore);
      void speak(opt.speech);
      interactionsApi.record({ location: displayLocation, promptType: opt.label, selectedText: opt.speech });
      return;
    }
    const shouldAskWho = opt.askWho && peopleForContext.length > 0;
    if (shouldAskWho) {
      setWhoToAsk({ option: opt, speech: opt.speech });
    } else {
      void speak(opt.speech).then(() => openFollowUpIfNeeded(opt));
      interactionsApi.record({ location: displayLocation, promptType: opt.label, selectedText: opt.speech });
    }
  };

  const handleWhoSelected = (person: PreferenceItem, baseSpeech: string, opt: QuickSpeakOption) => {
    const msg = `${person.label}, ${baseSpeech.toLowerCase()}`;
    void speak(msg).then(() => openFollowUpIfNeeded(opt));
    setWhoToAsk(null);
    interactionsApi.record({ location: displayLocation, promptType: opt.label, selectedText: msg });
  };

  const classifyPainTap = (x: number, y: number) => {
    // x,y are normalized 0..1 within the full tap area.
    // Figure: ~30% width centered (35%–65%), ~60% height centered (20%–80%).
    // Remap to body coordinates 0–1.
    const bodyX = Math.max(0, Math.min(1, (x - 0.35) / 0.30));
    const bodyY = Math.max(0, Math.min(1, (y - 0.20) / 0.60));
    const isLeft = bodyX < 0.5;
    const isOuter = bodyX <= 0.32 || bodyX >= 0.68; // Arms at sides of figure

    // Head (top ~20% of figure height)
    if (bodyY < 0.20) {
      return { bodyArea: "HEAD", bodyPartLabel: "head", icon: "🤕" };
    }

    // Arms / elbows / hands
    if (isOuter) {
      const side = isLeft ? "LEFT" : "RIGHT";
      if (bodyY < 0.40) {
        return { bodyArea: `${side}_ARM`, bodyPartLabel: `${isLeft ? "left" : "right"} arm`, icon: "💪" };
      }
      if (bodyY < 0.55) {
        return {
          bodyArea: `${side}_ELBOW`,
          bodyPartLabel: `${isLeft ? "left" : "right"} elbow`,
          icon: "🦾",
        };
      }
      if (bodyY < 0.75) {
        return {
          bodyArea: `${side}_HAND`,
          bodyPartLabel: `${isLeft ? "left" : "right"} hand`,
          icon: "✋",
        };
      }
    }

    // Torso and legs (center of figure)
    if (bodyY < 0.38) {
      return { bodyArea: "CHEST", bodyPartLabel: "chest", icon: "🫀" };
    }
    if (bodyY < 0.58) {
      return { bodyArea: "TUMMY", bodyPartLabel: "tummy", icon: "🤢" };
    }
    if (bodyY < 0.85) {
      return {
        bodyArea: isLeft ? "LEFT_KNEE" : "RIGHT_KNEE",
        bodyPartLabel: `${isLeft ? "left" : "right"} knee`,
        icon: "🦵",
      };
    }
    return {
      bodyArea: isLeft ? "LEFT_LEG" : "RIGHT_LEG",
      bodyPartLabel: `${isLeft ? "left" : "right"} leg`,
      icon: "🦿",
    };
  };

  const painSpeechForSeverity = (bodyPartLabel: string, severity: number) => {
    if (severity <= 3) return `My ${bodyPartLabel} is slightly sore.`;
    if (severity <= 6) return `My ${bodyPartLabel} hurts.`;
    return `My ${bodyPartLabel} hurts a lot.`;
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [homePeople, schoolPeopleResp, busPeopleResp, foodList, drinkList, actList, profileResp] =
          await Promise.all([
            preferencesApi.whoToAsk("HOME"),
            preferencesApi.whoToAsk("SCHOOL"),
            preferencesApi.whoToAsk("BUS"),
            preferencesApi.list("FOOD"),
            preferencesApi.list("DRINK"),
            preferencesApi.list("ACTIVITY"),
            profileApi.get().catch(() => null),
          ]);
        if (!cancelled) {
          setFamily(homePeople);
          setSchoolPeople(schoolPeopleResp);
          setBusStaff(busPeopleResp);
          setFoods(foodList);
          setDrinks(drinkList);
          setActivities(actList);
          if (profileResp?.maxOptions) setMaxOptions(profileResp.maxOptions);
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

  const quickSpeakOptions = useMemo(() => {
    if (testTimelineItemId === "mood") {
      return MOOD_OPTIONS.map((m) => ({
        label: m.label,
        speech: m.speech,
        icon: m.icon,
        tone: m.tone,
        moodScore: m.score,
      })) as QuickSpeakOption[];
    }
    return optionsForBlock(displayBlock, displayLocation, maxOptions);
  }, [testTimelineItemId, displayBlock, displayLocation, maxOptions]);

  const scopeForLocation = displayLocation === "SCHOOL" || displayLocation === "BUS" ? "SCHOOL" : "HOME";
  const filteredFoods = useMemo(
    () => foods.filter((f) => f.scope === scopeForLocation || f.scope === "BOTH"),
    [foods, scopeForLocation]
  );
  const filteredDrinks = useMemo(
    () => drinks.filter((d) => d.scope === scopeForLocation || d.scope === "BOTH"),
    [drinks, scopeForLocation]
  );
  const filteredActivities = useMemo(
    () => activities.filter((a) => a.scope === scopeForLocation || a.scope === "BOTH"),
    [activities, scopeForLocation]
  );
  const filteredTvShows = useMemo(
    () => filteredActivities.filter((a) => a.category === "TV_SHOW"),
    [filteredActivities]
  );

  const handleItemSelect = (itemId: string) => {
    setTestTimelineItemId((prev) => (prev === itemId ? null : itemId));
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
          location={displayLocation === "SCHOOL" || displayLocation === "BUS" ? "SCHOOL" : displayLocation === "OUT" ? "OUT" : "HOME"}
          onItemSelect={handleItemSelect}
          testTimelineItemId={testTimelineItemId}
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
                {displayLocation === "HOME" ? (
                  <Home className="h-5 w-5 text-indigo-600" aria-hidden />
                ) : displayLocation === "SCHOOL" ? (
                  <GraduationCap className="h-5 w-5 text-indigo-600" aria-hidden />
                ) : displayLocation === "BUS" ? (
                  <Bus className="h-5 w-5 text-indigo-600" aria-hidden />
                ) : (
                  <MapPin className="h-5 w-5 text-indigo-600" aria-hidden />
                )}
                {displayLocation === "HOME"
                  ? "At home"
                  : displayLocation === "SCHOOL"
                    ? "At school"
                    : displayLocation === "BUS"
                      ? "On bus"
                      : "Out & about"}
              </span>
              <span className="text-[11px] text-slate-500">
                It&apos;s {timeLabel} — {testTimelineItemId === "mood" ? "Feelings check" : BLOCK_LABELS[displayBlock].toLowerCase()}
                {testTimelineItemId && (
                  <button
                    type="button"
                    onClick={() => setTestTimelineItemId(null)}
                    className="ml-1 text-amber-600 hover:text-amber-700 underline"
                  >
                    (reset)
                  </button>
                )}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPainSelectedArea(null);
                  setPainTap(null);
                  setShowPainModal(true);
                }}
                className="mt-1 inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
              >
                <span aria-hidden="true">⚠️</span> I feel pain / Help
              </button>
            </div>
          </header>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">
              {testTimelineItemId === "mood" ? "Feelings check" : BLOCK_LABELS[displayBlock]}
              {testTimelineItemId && (
                <span className="ml-2 text-amber-600 text-xs font-normal">
                  (preview)
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-600">
              {testTimelineItemId === "mood"
                ? "How are you feeling? Tap to speak and record."
                : "Quick options for this part of the day."}
              {testTimelineItemId
                ? " Tap another timeline item to preview, or reset to actual time."
                : " Tap any timeline item to preview its options."}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {quickSpeakOptions.map((opt, i) => (
                <button
                  key={`${opt.label}-${opt.speech}-${i}`}
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

          {peopleForContext.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-800">
                {displayLocation === "HOME"
                  ? "Who is at home?"
                  : displayLocation === "SCHOOL"
                    ? "Who is at school?"
                    : displayLocation === "BUS"
                      ? "People on bus"
                      : "Who is here?"}
              </h2>
              <p className="text-xs text-slate-600">
                For some needs above, you can pick who to ask after tapping.
              </p>
              <div className="flex flex-wrap gap-3">
                {peopleForContext.map((person) => (
                  <span
                    key={person.id}
                    className="inline-flex items-center gap-3 rounded-2xl border-2 border-indigo-100 bg-white/90 px-4 py-2"
                  >
                    <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pink-100">
                      {person.imageUrl ? (
                        <img src={person.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-pink-700">{person.label.charAt(0).toUpperCase()}</span>
                      )}
                    </span>
                    <span className="text-sm font-bold text-slate-800">{person.label}</span>
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
                  const fallbackIcon = !item.imageUrl ? fallbackIconForLabel(label, followUpPanel) : null;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        void speak(speech);
                        interactionsApi.record({ location: displayLocation, promptType: followUpPanel, selectedText: speech });
                      }}
                      className="aac-tile flex items-center gap-4 py-4 px-5 rounded-2xl border-2 transition-transform active:scale-95 hover:scale-[1.02]"
                      aria-label={speech}
                    >
                      {item.imageUrl ? (
                        <span className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                        </span>
                      ) : fallbackIcon ? (
                        <span className="h-20 w-20 shrink-0 flex items-center justify-center rounded-xl bg-indigo-50">
                          <Icon icon={fallbackIcon} width={48} height={48} aria-hidden />
                        </span>
                      ) : null}
                      <span className="font-bold text-base">{label}</span>
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
            <h2 className="mb-2 text-lg font-bold text-slate-900">
              {displayLocation === "HOME"
                ? "Who do you want to ask?"
                : displayLocation === "SCHOOL"
                  ? "Who at school?"
                  : displayLocation === "BUS"
                    ? "Who on the bus?"
                    : "Who do you want to tell?"}
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              Tap who you&apos;d like to ask for: {whoToAsk.option.label}
            </p>
            <div className="flex flex-wrap gap-4">
              {peopleForContext.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => handleWhoSelected(person, whoToAsk.speech, whoToAsk.option)}
                  className="flex flex-col items-center gap-2 rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-4 min-w-[120px] hover:border-indigo-300 hover:bg-indigo-100 active:scale-[0.98]"
                >
                  <span className="inline-flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pink-100 ring-2 ring-indigo-200/50">
                    {person.imageUrl ? (
                      <img src={person.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-pink-700">{person.label.charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                  <span className="text-base font-bold text-slate-800">{person.label}</span>
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
                interactionsApi.record({ location: displayLocation, promptType: whoToAsk.option.label, selectedText: whoToAsk.speech });
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
                  <span className="mt-2 text-sm font-bold text-slate-800">{m.label}</span>
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
          <div className="relative max-w-lg w-full rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setShowPainModal(false);
                setPainSelectedArea(null);
                setPainTap(null);
              }}
              className="absolute right-4 top-4 text-sm text-slate-500 hover:text-slate-700"
            >
              Close
            </button>

            {!painSelectedArea ? (
              <>
                <h2 className="mb-2 text-lg font-bold text-slate-900">Where does it hurt?</h2>
                <p className="mb-4 text-sm text-slate-600">
                  Tap on the picture where it hurts, or press &quot;Help now&quot;.
                </p>

                <div className="mx-auto flex w-full max-w-[480px] min-h-[420px] items-center justify-center">
                  <div
                    className="relative w-full min-h-[400px] overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-sm aspect-square"
                    onClick={(e) => {
                      const el = e.currentTarget;
                      const rect = el.getBoundingClientRect();
                      const x = (e.clientX - rect.left) / rect.width;
                      const y = (e.clientY - rect.top) / rect.height;

                      const xPct = Math.max(0, Math.min(100, x * 100));
                      const yPct = Math.max(0, Math.min(100, y * 100));
                      const result = classifyPainTap(x, y);
                      setPainTap({ xPct, yPct });
                      setPainSelectedArea(result);
                      void speak(`My ${result.bodyPartLabel} hurts.`);
                    }}
                    role="button"
                    aria-label="Tap the body where it hurts"
                  >
                    <img
                      src="https://media.istockphoto.com/id/1331743543/vector/cute-beautiful-little-girl-is-standing-and-smiling-funny-child-with-pigtails-in-shorts-and-a.jpg?s=612x612&w=0&k=20&c=9jAF0jgISBhsdEOQsIOyhNr2jugxHCfGXNI8VZPc6cQ="
                      alt="Tap where it hurts"
                      className="block w-full h-full object-cover select-none"
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
                      await wellbeingApi.recordPain("UNKNOWN", 8, "Help now button");
                      await speak("I need help now.");
                      setShowPainModal(false);
                      setPainSelectedArea(null);
                      setPainTap(null);
                    }}
                  >
                    Help now
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPainModal(false);
                      setPainSelectedArea(null);
                      setPainTap(null);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl" aria-hidden="true">
                    {painSelectedArea.icon}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    How much does your {painSelectedArea.bodyPartLabel} hurt?
                  </h2>
                </div>
                <p className="mb-4 text-sm text-slate-600">
                  Tap on the bar. Green = slightly sore, orange = hurts, red = hurts a lot.
                </p>

                <div
                  className="relative h-14 w-full rounded-2xl cursor-pointer overflow-hidden border-2 border-slate-200 shadow-inner"
                  style={{
                    background:
                      "linear-gradient(to right, #22c55e 0%, #84cc16 25%, #eab308 50%, #f97316 75%, #ef4444 100%)",
                  }}
                  onClick={async (e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const severity = Math.max(1, Math.min(10, Math.round(1 + x * 9)));
                    const speech = painSpeechForSeverity(painSelectedArea.bodyPartLabel, severity);

                    await wellbeingApi.recordPain(
                      painSelectedArea.bodyArea,
                      severity,
                      `severity=${severity} from scale`
                    );
                    await speak(speech);
                    setShowPainModal(false);
                    setPainSelectedArea(null);
                    setPainTap(null);
                  }}
                  role="button"
                  aria-label="Tap to select pain severity: left = mild (1–3), middle = okay (4–6), right = severe (7–10)"
                >
                  <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800 drop-shadow-sm">
                      <span aria-hidden>😊</span> 1–3 Mild
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800 drop-shadow-sm">
                      <span aria-hidden>😐</span> 4–6 Okay
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800 drop-shadow-sm">
                      <span aria-hidden>😣</span> 7–10 Severe
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPainSelectedArea(null);
                      setPainTap(null);
                    }}
                  >
                    Change location
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
}

