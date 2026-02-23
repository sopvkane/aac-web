package com.sophie.aac.tts.service;

import com.microsoft.cognitiveservices.speech.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class TtsService {

    private final String speechKey;
    private final String speechRegion;

    private static final String DEFAULT_VOICE = "en-GB-SoniaNeural";

    public TtsService(
        @Value("${AZURE_SPEECH_KEY:}") String speechKey,
        @Value("${AZURE_SPEECH_REGION:}") String speechRegion
    ) {
        this.speechKey = speechKey;
        this.speechRegion = speechRegion;
    }

    public byte[] synthesizeMp3(String text, String voiceOverride) {
        if (speechKey == null || speechKey.isBlank() || speechRegion == null || speechRegion.isBlank()) {
            throw new IllegalStateException("Azure Speech is not configured (AZURE_SPEECH_KEY/AZURE_SPEECH_REGION).");
        }

        String safeText = text == null ? "" : text.trim();
        if (safeText.isBlank()) {
            throw new IllegalArgumentException("Text must not be blank.");
        }

        String voice = (voiceOverride == null || voiceOverride.isBlank()) ? DEFAULT_VOICE : voiceOverride.trim();

        try {
            SpeechConfig config = SpeechConfig.fromSubscription(speechKey, speechRegion);
            config.setSpeechSynthesisVoiceName(voice);
            config.setSpeechSynthesisOutputFormat(SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3);

            try (SpeechSynthesizer synthesizer = new SpeechSynthesizer(config)) {
                SpeechSynthesisResult result = synthesizer.SpeakTextAsync(safeText).get(10, TimeUnit.SECONDS);

                if (result.getReason() == ResultReason.SynthesizingAudioCompleted) {
                    return result.getAudioData();
                }

                if (result.getReason() == ResultReason.Canceled) {
                    SpeechSynthesisCancellationDetails details = SpeechSynthesisCancellationDetails.fromResult(result);
                    throw new RuntimeException("TTS canceled: " + details.getReason() + " - " + details.getErrorDetails());
                }

                throw new RuntimeException("TTS failed with reason: " + result.getReason());
            }
        } catch (Exception e) {
            throw new RuntimeException("TTS synthesis failed: " + e.getMessage(), e);
        }
    }
}