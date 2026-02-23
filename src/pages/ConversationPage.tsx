import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { speakText } from "../api/tts";
import { ChevronDown, Mic, Square, Sparkles } from "lucide-react";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { getDialogueReplies, type DialogueResponse } from "../api/dialogue";

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
function phraseInstead(item: string) {
  return `Could I have ${item.toLowerCase()} instead?`;
}

export function ConversationPage() {
  const stt = useSpeechToText();

  const [name, setName] = useState<string>(() => getStoredName() ?? "");
  const [hasName, setHasName] = useState<boolean>(() => Boolean(getStoredName()));
  const [nameInput, setNameInput] = useState("");

  const [questionText, setQuestionText] = useState<string>("");

  const [showMore, setShowMore] = useState(false);

  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ai, setAi] = useState<DialogueResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [statusMsg, setStatusMsg] = useState("");

  const nameRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasName) setTimeout(() => nameRef.current?.focus(), 50);
  }, [hasName]);

  useEffect(() => {
    if (stt.finalText) setQuestionText(stt.finalText);
  }, [stt.finalText]);

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
  };

  const clearHeardQuestion = () => {
    setQuestionText("");
    setAi(null);
    setAiError(null);
  };

  // Debounced AI call when prompt changes and we’re not actively listening
  useEffect(() => {
    if (!hasName) return;

    const text = prompt.trim();
    if (!text) return;

    if (stt.listening) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      setAiLoading(true);
      setAiError(null);

      getDialogueReplies({
        userName: name,
        questionText: text,
        context: { location: "HOME" },
      })
        .then((res) => setAi(res))
        .catch((e) => setAiError(e instanceof Error ? e.message : "Failed to get AI replies"))
        .finally(() => setAiLoading(false));
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [prompt, name, hasName, stt.listening]);

  // Onboarding screen
  if (!hasName) {
    return (
      <section className="grid gap-8">
        <header className="grid gap-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900">Welcome</h1>
          <p className="text-zinc-700 text-lg sm:text-xl">What should I call you?</p>
        </header>

        <div className="rounded-[28px] border-2 border-indigo-100 bg-white/80 backdrop-blur p-6 shadow-[var(--shadow)] max-w-xl">
          <label htmlFor="name" className="text-xl font-semibold text-zinc-900">Your name</label>
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

          <p className="mt-4 text-sm text-zinc-600">Saved on this device for demo purposes.</p>
        </div>

        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{statusMsg}</div>
      </section>
    );
  }

  const replies = ai?.topReplies?.slice(0, 3) ?? [];
  const optionGroups = ai?.optionGroups ?? [];

  return (
    <section className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900">Conversation</h1>
        <p className="text-zinc-700 text-lg sm:text-xl">
          Tap <span className="font-semibold">Listen</span> to capture a question, then choose a reply to speak.
        </p>
      </header>

      <div className="rounded-[28px] border-2 border-indigo-100 bg-white/80 backdrop-blur p-6 shadow-[var(--shadow)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
            <div className="text-sm font-bold text-indigo-700">Prompt</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900">{prompt}</div>

            {stt.listening && stt.interimText && (
              <p className="mt-2 text-lg text-zinc-700" role="status" aria-live="polite">
                Hearing: {stt.interimText}
              </p>
            )}

            {stt.error && (
              <div role="alert" className="mt-3 rounded-[18px] border-2 border-red-300 bg-red-50 p-4 text-red-900">
                {stt.error}
              </div>
            )}

            <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
              <Sparkles className="h-4 w-4" aria-hidden />
              {aiLoading ? "Generating replies…" : ai?.intent ? `Intent: ${ai.intent}` : "Waiting for a question…"}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => void speak(prompt)} disabled={speaking}>
              {speaking ? "Speaking…" : "Speak prompt"}
            </Button>

            <Button
              type="button"
              variant={stt.listening ? "destructive" : "secondary"}
              aria-pressed={stt.listening}
              onClick={() => void (stt.listening ? stt.stop() : stt.start())}
              disabled={speaking}
            >
              {stt.listening ? <Square aria-hidden className="h-5 w-5" /> : <Mic aria-hidden className="h-5 w-5" />}
              {stt.listening ? "Stop listening" : "Listen"}
            </Button>

            <Button type="button" variant="outline" onClick={clearHeardQuestion} disabled={speaking || stt.listening || !questionText.trim()}>
              Clear question
            </Button>
          </div>
        </div>

        {(error || aiError) && (
          <div role="alert" className="mt-4 rounded-[18px] border-2 border-red-300 bg-red-50 p-4 text-red-900 text-lg">
            {error ?? aiError}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {replies.length === 3 ? (
            replies.map((r) => (
              <Button
                key={r.id}
                type="button"
                variant="outline"
                className="min-h-14 rounded-[22px] border-2 bg-white text-left justify-start px-5 py-4 hover:bg-indigo-50"
                onClick={() => void speak(r.text)}
                disabled={speaking || aiLoading}
                aria-label={`Speak: ${r.text}`}
              >
                <div className="grid gap-1">
                  <div className="text-lg font-extrabold">{r.label || "Option"}</div>
                  <div className="text-base text-zinc-700">{r.text}</div>
                </div>
              </Button>
            ))
          ) : (
            <div className="text-zinc-700">Ask a question (or click Listen) to generate replies.</div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowMore((v) => !v)}
            disabled={speaking || optionGroups.length === 0}
          >
            <ChevronDown aria-hidden className="h-5 w-5" />
            {showMore ? "Hide options" : optionGroups.length ? "More options" : "No options"}
          </Button>

          <Button type="button" variant="outline" onClick={resetName} disabled={speaking || stt.listening}>
            Change name
          </Button>
        </div>

        {showMore && optionGroups.length > 0 && (
          <div className="mt-6 grid gap-4">
            {optionGroups.map((g) => (
              <div key={g.id} className="rounded-[22px] border-2 border-indigo-100 bg-indigo-50 p-5">
                <div className="text-xl font-extrabold text-zinc-900">{g.title}</div>
                <p className="text-zinc-700 mt-1">Tap an item to speak a polite reply automatically.</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {g.items.slice(0, 6).map((item) => (
                    <Button
                      key={item}
                      type="button"
                      variant="outline"
                      className="min-h-14 rounded-[20px]"
                      onClick={() => void speak(phraseYes(item))}
                      disabled={speaking}
                    >
                      {item}
                    </Button>
                  ))}
                </div>

                {g.items[0] && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-14 rounded-[22px] justify-start text-left"
                      onClick={() => void speak(phraseYes(g.items[0]))}
                      disabled={speaking}
                    >
                      <span className="text-lg font-extrabold">Yes please</span>
                      <span className="ml-2 text-zinc-700">— {g.items[0]}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-14 rounded-[22px] justify-start text-left"
                      onClick={() => void speak(phraseInstead(g.items[0]))}
                      disabled={speaking}
                    >
                      <span className="text-lg font-extrabold">Instead</span>
                      <span className="ml-2 text-zinc-700">— {g.items[0]}</span>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{statusMsg}</div>
    </section>
  );
}