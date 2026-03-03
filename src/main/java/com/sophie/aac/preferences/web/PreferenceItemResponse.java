package com.sophie.aac.preferences.web;

import java.util.UUID;

public record PreferenceItemResponse(
    UUID id,
    String kind,
    String label,
    String category,
    String tags,
    String imageUrl,
    String scope,
    int priority
) {}

