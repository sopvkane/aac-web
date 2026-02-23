import { useEffect, useRef, useState } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { getSpeechToken } from "../api/speechToken";

export function useSpeechToText() {
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const stoppingRef = useRef(false);

  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const stop = async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;

    try {
      const r = recognizerRef.current;
      if (!r) {
        setListening(false);
        return;
      }

      await new Promise<void>((resolve) => {
        r.stopContinuousRecognitionAsync(
          () => resolve(),
          () => resolve()
        );
      });

      r.close();
      recognizerRef.current = null;
      setListening(false);
    } finally {
      stoppingRef.current = false;
    }
  };

  const start = async () => {
    setError(null);
    setInterimText("");
    setFinalText("");

    try {
      const { token, region } = await getSpeechToken();

      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
        token,
        region
      );
      speechConfig.speechRecognitionLanguage = "en-GB";

      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

      recognizerRef.current = recognizer;

      recognizer.recognizing = (_s, e) => {
        setInterimText(e.result?.text ?? "");
      };

      recognizer.recognized = (_s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const t = (e.result.text ?? "").trim();
          if (t) setFinalText(t);
        }
      };

      recognizer.canceled = (_s, e) => {
        setError(`Speech canceled: ${e.errorDetails || e.reason}`);
        void stop();
      };

      recognizer.sessionStopped = () => {
        void stop();
      };

      setListening(true);

      await new Promise<void>((resolve, reject) => {
        recognizer.startContinuousRecognitionAsync(
          () => resolve(),
          (err) => reject(err)
        );
      });
    } catch (e) {
      setListening(false);
      setError(e instanceof Error ? e.message : "Failed to start recognition");
    }
  };

  useEffect(() => {
    return () => {
      void stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { listening, interimText, finalText, error, start, stop };
}