import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { speakText } from "../api/tts";
import { Droplet, Coffee, Milk, Apple, Citrus, GlassWater, ChevronDown } from "lucide-react";

type Drink = {
  key: "water" | "orange_juice" | "apple_juice" | "milk" | "tea";
  label: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const DRINKS: Drink[] = [
  { key: "water", label: "Water", Icon: GlassWater },
  { key: "orange_juice", label: "Orange juice", Icon: Citrus },
  { key: "apple_juice", label: "Apple juice", Icon: Apple },
  { key: "milk", label: "Milk", Icon: Milk },
  { key: "tea", label: "Tea", Icon: Coffee },
];

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

function phraseYes(item: string) {
  return `Yes please, I'd like ${item.toLowerCase()}.`;
}
function phraseNo() {
  return "No thank you.";
}
function phraseInstead(item: string) {
  return `Could I have ${item.toLowerCase()} instead?`;
}

export function ConversationPage() {
  const [name, setName] = useState<string>(() => getStoredName() ?? "");
  const [hasName, setHasName] = useState<boolean>(() => Boolean(getStoredName()));
  const [nameInput, setNameInput] = useState("");

  const [showMore, setShowMore] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<Drink>(DRINKS[0]);

  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SR live region message
  const [statusMsg, setStatusMsg] = useState("");

  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!hasName) setTimeout(() => nameRef.current?.focus(), 50);
  }, [hasName]);

  const prompt = useMemo(() => `${name}, would you like a drink?`, [name]);

  const announce = (msg: string) => setStatusMsg(msg);

  const speak = async (text: string) => {
    setError(null);
    setSpeaking(true);
    announce("Speaking");
    try {
      // Keep voice configurable later; default voice is set server-side
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
  };

  // Onboarding screen
  if (!hasName) {
    return (
      <section className="grid gap-8">
        <header className="grid gap-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900">
            Welcome
          </h1>
          <p className="text-zinc-700 text-lg sm:text-xl">
            What should I call you?
          </p>
        </header>

        <div className="rounded-[28px] border-2 border-indigo-100 bg-white/80 backdrop-blur p-6 shadow-[var(--shadow)] max-w-xl">
          <label htmlFor="name" className="text-xl font-semibold text-zinc-900">
            Your name
          </label>
          <input
            id="name"
            ref={nameRef}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="mt-2 w-full rounded-[18px] border-2 border-indigo-200 bg-white px-4 py-3 text-xl"
            placeholder="e.g. Sophie"
            autoComplete="name"
          />

          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" onClick={() => void completeOnboarding()} disabled={speaking || !nameInput.trim()}>
              {speaking ? "Speaking…" : "Continue"}
            </Button>

            <Button type="button" variant="outline" onClick={() => void speak("Hello. This is your AAC device.")} disabled={speaking}>
              Test voice
            </Button>
          </div>

          {error && (
            <div role="alert" className="mt-4 rounded-[18px] border-2 border-red-300 bg-red-50 p-4 text-red-900">
              {error}
            </div>
          )}

          <p className="mt-4 text-sm text-zinc-600">
            Saved on this device for demo purposes.
          </p>
        </div>

        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {statusMsg}
        </div>
      </section>
    );
  }

  // Main conversation screen
  return (
    <section className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900">
          Conversation
        </h1>
        <p className="text-zinc-700 text-lg sm:text-xl">
          Tap a reply to speak it out loud.
        </p>
      </header>

      <div className="rounded-[28px] border-2 border-indigo-100 bg-white/80 backdrop-blur p-6 shadow-[var(--shadow)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
            <div className="text-sm font-bold text-indigo-700">Prompt</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900">{prompt}</div>
          </div>

          <Button type="button" variant="outline" onClick={() => void speak(prompt)} disabled={speaking}>
            {speaking ? "Speaking…" : "Speak prompt"}
          </Button>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-[18px] border-2 border-red-300 bg-red-50 p-4 text-red-900 text-lg">
            {error}
          </div>
        )}

        {/* Quick replies (top 3) */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-14 rounded-[22px] border-2 border-emerald-200 bg-white text-left justify-start px-5 py-4 hover:bg-emerald-50"
            onClick={() => void speak(phraseYes("water"))}
            disabled={speaking}
          >
            <div className="flex gap-4">
              <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-white border-2 border-emerald-200">
                <Droplet aria-hidden className="h-6 w-6" />
              </div>
              <div className="grid gap-1">
                <div className="text-lg font-extrabold">Yes (water)</div>
                <div className="text-base text-zinc-700">{phraseYes("water")}</div>
              </div>
            </div>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="min-h-14 rounded-[22px] border-2 border-amber-200 bg-white text-left justify-start px-5 py-4 hover:bg-amber-50"
            onClick={() => void speak(phraseNo())}
            disabled={speaking}
          >
            <div className="grid gap-1">
              <div className="text-lg font-extrabold">No thanks</div>
              <div className="text-base text-zinc-700">{phraseNo()}</div>
            </div>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="min-h-14 rounded-[22px] border-2 border-indigo-200 bg-white text-left justify-start px-5 py-4 hover:bg-indigo-50"
            onClick={() => void speak(phraseInstead("orange juice"))}
            disabled={speaking}
          >
            <div className="grid gap-1">
              <div className="text-lg font-extrabold">Orange juice instead</div>
              <div className="text-base text-zinc-700">{phraseInstead("orange juice")}</div>
            </div>
          </Button>
        </div>

        {/* More options */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={() => setShowMore((v) => !v)} disabled={speaking}>
            <ChevronDown aria-hidden className="h-5 w-5" />
            {showMore ? "Hide options" : "More drinks"}
          </Button>

          <Button type="button" variant="outline" onClick={resetName} disabled={speaking}>
            Change name
          </Button>
        </div>

        {showMore && (
          <div className="mt-6 rounded-[22px] border-2 border-indigo-100 bg-indigo-50 p-5">
            <div className="text-xl font-extrabold text-zinc-900">Pick a drink</div>
            <p className="text-zinc-700 mt-1">
              Tap a drink to speak a polite reply automatically.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-5">
              {DRINKS.map((d) => (
                <Button
                  key={d.key}
                  type="button"
                  variant={selectedDrink.key === d.key ? "default" : "outline"}
                  className="min-h-14 rounded-[20px]"
                  onClick={() => {
                    setSelectedDrink(d);
                    void speak(phraseYes(d.label));
                  }}
                  disabled={speaking}
                >
                  <d.Icon aria-hidden className="h-5 w-5" />
                  {d.label}
                </Button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-14 rounded-[22px] justify-start text-left"
                onClick={() => void speak(phraseYes(selectedDrink.label))}
                disabled={speaking}
              >
                <span className="text-lg font-extrabold">Yes please</span>
                <span className="ml-2 text-zinc-700">— {selectedDrink.label}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="min-h-14 rounded-[22px] justify-start text-left"
                onClick={() => void speak(phraseInstead(selectedDrink.label))}
                disabled={speaking}
              >
                <span className="text-lg font-extrabold">Instead</span>
                <span className="ml-2 text-zinc-700">— {selectedDrink.label}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMsg}
      </div>
    </section>
  );
}