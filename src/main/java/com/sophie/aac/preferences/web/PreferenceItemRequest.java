package com.sophie.aac.preferences.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PreferenceItemRequest(
    @NotBlank @Size(max = 40) String kind,
    @NotBlank @Size(max = 80) String label,
    @Size(max = 40) String category,
    @Size(max = 500) String tags,
    @Size(max = 255) String imageUrl,
    @NotNull @Size(max = 16) String scope,
    Integer priority
) {}

