import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Mic, Square, Sparkles } from "lucide-react";

import { Button } from "../components/ui/button";
import { speakText } from "../api/tts";
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

  const [name, setName] = useState(() => getStoredName() ?? "");
  const [hasName, setHasName] = useState(() => Boolean(getStoredName()));
  const [nameInput, setNameInput] = useState("");

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
  };

  // Generate AI replies only when there is a real question (not the default prompt)
  useEffect(() => {
    if (!hasName) return;

    const q = questionText.trim();
    if (!q) return;
    if (stt.listening) return;

    // prevent repeat calls for the same question
    if (q === lastRequestedQuestionRef.current) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      lastRequestedQuestionRef.current = q;
      setAiLoading(true);
      setAiError(null);

      getDialogueReplies({
        userName: name,
        questionText: q,
        context: { location: "HOME" }
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
  }, [questionText, name, hasName, stt.listening]);

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
            <div className="mt-3 text-sm text-slate-500">{statusMsg}</div>
          )}
        </div>
      </div>
    );
  }

  const replies = ai?.topReplies?.slice(0, 3) ?? [];
  const optionGroups = ai?.optionGroups ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="rounded-[28px] border border-indigo-100 bg-white p-8 shadow-sm">
        <h1 className="text-6xl font-black tracking-tight">Conversation</h1>
        <p className="mt-3 text-lg text-slate-600">
          Tap Listen to capture a question, then choose a reply to speak.
        </p>

        <div className="mt-8 rounded-[22px] border border-indigo-100 bg-indigo-50/40 p-6">
          <div className="text-sm font-semibold text-indigo-700">Prompt</div>
          <div className="mt-2 text-4xl font-black tracking-tight">
            {prompt}
          </div>

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
            replies.map((r) => (
              <button
                key={r.text}
                type="button"
                onClick={() => void speak(r.text)}
                disabled={speaking}
                aria-label={`Speak: ${r.text}`}
                className="group rounded-[24px] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md disabled:opacity-50"
              >
                <div className="text-sm font-semibold text-slate-500">
                  {r.label || "Option"}
                </div>
                <div className="mt-2 text-2xl font-extrabold leading-snug">
                  {r.text}
                </div>
              </button>
            ))
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
                key={g.title}
                className="rounded-[22px] border border-slate-200 bg-slate-50 p-6"
              >
                <div className="text-xl font-black">{g.title}</div>
                <p className="mt-1 text-sm text-slate-600">
                  Tap an item to speak a polite reply automatically.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {g.items.slice(0, 6).map((item) => (
                    <Button
                      key={item}
                      onClick={() => void speak(phraseYes(item))}
                      disabled={speaking}
                      className="rounded-[18px]"
                    >
                      {item}
                    </Button>
                  ))}
                </div>

                {g.items[0] && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => void speak(phraseYes(g.items[0]))}
                      disabled={speaking}
                      className="rounded-[18px]"
                    >
                      Yes please — {g.items[0]}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void speak(phraseInstead(g.items[0]))}
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
          <div className="mt-6 text-sm text-slate-500">{statusMsg}</div>
        )}
      </div>
    </div>
  );
}