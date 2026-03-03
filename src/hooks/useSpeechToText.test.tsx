import { renderHook, act } from "@testing-library/react";
import { useSpeechToText } from "./useSpeechToText";

const startContinuousRecognitionAsync = vi.fn<(onSuccess: () => void, onError: (e: unknown) => void) => void>();
const stopContinuousRecognitionAsync = vi.fn<(onSuccess: () => void, onError: (e: unknown) => void) => void>();

let recognizingHandler: ((s: unknown, e: { result?: { text?: string } }) => void) | null = null;
let recognizedHandler: ((s: unknown, e: { result: { reason: number; text?: string } }) => void) | null = null;

vi.mock("microsoft-cognitiveservices-speech-sdk", () => {
  class FakeRecognizer {
    recognizing = ((): typeof recognizingHandler => null) as ((
      s: unknown,
      e: { result?: { text?: string } }
    ) => void);
    recognized = ((): typeof recognizedHandler => null) as ((
      s: unknown,
      e: { result: { reason: number; text?: string } }
    ) => void);
    canceled = () => {};
    sessionStopped = () => {};

    constructor() {
      recognizingHandler = (s, e) => this.recognizing(s, e);
      recognizedHandler = (s, e) => this.recognized(s, e);
    }

    startContinuousRecognitionAsync = startContinuousRecognitionAsync as (a: () => void, b: (e: unknown) => void) => void;
    stopContinuousRecognitionAsync = stopContinuousRecognitionAsync as (a: () => void, b: (e: unknown) => void) => void;
    close() {}
  }

  const SpeechConfig = {
    fromAuthorizationToken: vi.fn().mockReturnValue({}),
  };

  const AudioConfig = {
    fromDefaultMicrophoneInput: vi.fn().mockReturnValue({}),
  };

  const ResultReason = {
    RecognizedSpeech: 1,
  };

  return {
    SpeechRecognizer: FakeRecognizer,
    SpeechConfig,
    AudioConfig,
    ResultReason,
  };
});

vi.mock("../api/speechToken", () => ({
  getSpeechToken: vi.fn().mockResolvedValue({
    token: "test-token",
    region: "westeurope",
    expiresInSeconds: 600,
  }),
}));

describe("useSpeechToText", () => {
  beforeEach(() => {
    startContinuousRecognitionAsync.mockImplementation((onSuccess) => onSuccess());
    stopContinuousRecognitionAsync.mockImplementation((onSuccess) => onSuccess());
  });

  test("start sets listening and updates interim/final text", async () => {
    const { result } = renderHook(() => useSpeechToText());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.listening).toBe(true);

    act(() => {
      recognizingHandler?.(null, { result: { text: "hello" } });
    });
    expect(result.current.interimText).toBe("hello");

    act(() => {
      recognizedHandler?.(null, {
        result: { reason: 1, text: "hello world" },
      });
    });
    expect(result.current.finalText).toBe("hello world");
  });

  test("stop clears listening", async () => {
    const { result } = renderHook(() => useSpeechToText());

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.listening).toBe(true);

    await act(async () => {
      await result.current.stop();
    });

    expect(result.current.listening).toBe(false);
  });
});

