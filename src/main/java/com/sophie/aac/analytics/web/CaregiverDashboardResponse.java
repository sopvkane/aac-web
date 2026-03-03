package com.sophie.aac.analytics.web;

import com.sophie.aac.suggestions.domain.TimeBucket;

import java.time.Instant;
import java.util.Map;

public record CaregiverDashboardResponse(
    String period,
    Instant since,
    String displayName,
    String favFood,
    String favDrink,
    String favShow,
    Map<TimeBucket, Long> interactionsByTimeBucket,
    long totalInteractionsLast7Days,
    long todayInteractions,
    long wellbeingEntriesLast7Days,
    long painEventsLast7Days,
    Double averagePainSeverityLast7Days,
    Map<String, Long> painByBodyArea
) {
}

