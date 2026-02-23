package com.sophie.aac.tts.web;

public record TtsRequest(
    String text,
    String voice
) {}