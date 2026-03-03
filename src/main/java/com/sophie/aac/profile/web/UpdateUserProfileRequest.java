package com.sophie.aac.profile.web;

import com.sophie.aac.suggestions.domain.LocationCategory;
import jakarta.validation.constraints.*;

public record UpdateUserProfileRequest(
    @NotBlank @Size(max = 50) String displayName,
    @NotBlank @Size(max = 50) String wakeName,
    boolean detailsDefault,
    boolean voiceDefault,
    boolean aiEnabled,
    boolean memoryEnabled,
    boolean analyticsEnabled,
    @NotNull LocationCategory defaultLocation,
    boolean allowHome,
    boolean allowSchool,
    boolean allowWork,
    boolean allowOther,
    @Min(1) @Max(6) int maxOptions,
    @Size(max = 50) String favFood,
    @Size(max = 50) String favDrink,
    @Size(max = 50) String favShow,
    @Size(max = 50) String favTopic,
    @Size(max = 500) String aboutUser,
    @Size(max = 32) String schoolDays,
    @Size(max = 8) String lunchTime,
    @Size(max = 8) String dinnerTime,
    @Size(max = 8) String bedTime,
    @Size(max = 280) String familyNotes,
    @Size(max = 280) String classmates,
    @Size(max = 280) String teachers,
    @Size(max = 280) String schoolActivities
) {}