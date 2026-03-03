package com.sophie.aac.analytics.service;

import com.sophie.aac.analytics.domain.InteractionEventEntity;
import com.sophie.aac.analytics.domain.WellbeingEntryEntity;
import com.sophie.aac.analytics.repository.InteractionEventRepository;
import com.sophie.aac.analytics.repository.WellbeingEntryRepository;
import com.sophie.aac.analytics.web.CaregiverDashboardResponse;
import com.sophie.aac.profile.domain.UserProfileEntity;
import com.sophie.aac.profile.service.CaregiverProfileService;
import com.sophie.aac.suggestions.domain.TimeBucket;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;

@Service
public class CaregiverDashboardService {

    private final CaregiverProfileService profileService;
    private final InteractionEventRepository interactionEvents;
    private final WellbeingEntryRepository wellbeingEntries;

    public CaregiverDashboardService(
        CaregiverProfileService profileService,
        InteractionEventRepository interactionEvents,
        WellbeingEntryRepository wellbeingEntries
    ) {
        this.profileService = profileService;
        this.interactionEvents = interactionEvents;
        this.wellbeingEntries = wellbeingEntries;
    }

    public CaregiverDashboardResponse getDashboard(String period) {
        UserProfileEntity profile = profileService.get();

        Instant now = Instant.now();
        ZoneId zone = ZoneId.systemDefault();

        Instant since = resolveSince(now, period);
        LocalDate today = LocalDate.now(zone);
        Instant todayStart = today.atStartOfDay(zone).toInstant();

        List<InteractionEventEntity> recentInteractions = interactionEvents.findByCreatedAtAfter(since);
        List<WellbeingEntryEntity> recentWellbeing = wellbeingEntries.findByCreatedAtAfter(since);

        Map<TimeBucket, Long> byBucket = new EnumMap<>(TimeBucket.class);
        for (TimeBucket b : TimeBucket.values()) {
            byBucket.put(b, 0L);
        }

        long todayInteractions = 0L;
        for (InteractionEventEntity e : recentInteractions) {
            TimeBucket bucket = bucketForInstant(e.getCreatedAt(), zone);
            byBucket.put(bucket, byBucket.get(bucket) + 1);

            if (!e.getCreatedAt().isBefore(todayStart)) {
                todayInteractions++;
            }
        }

        long wellbeingEntriesLast7Days = recentWellbeing.size();
        long painEventsLast7Days = 0L;
        long painSeveritySum = 0L;
        long painSeverityCount = 0L;
        Map<String, Long> painByBodyArea = new HashMap<>();

        for (WellbeingEntryEntity w : recentWellbeing) {
            String symptom = w.getSymptomType();
            if (symptom != null && symptom.equalsIgnoreCase("PAIN")) {
                painEventsLast7Days++;
                String area = w.getBodyArea();
                String key = (area == null || area.isBlank()) ? "UNKNOWN" : area.trim().toUpperCase(Locale.ROOT);
                painByBodyArea.put(key, painByBodyArea.getOrDefault(key, 0L) + 1L);
                if (w.getSeverity() != null) {
                    painSeveritySum += w.getSeverity();
                    painSeverityCount++;
                }
            }
        }

        Double avgSeverity = null;
        if (painSeverityCount > 0) {
            avgSeverity = painSeveritySum / (double) painSeverityCount;
        }

        return new CaregiverDashboardResponse(
            normalizePeriod(period),
            since,
            profile.getDisplayName(),
            profile.getFavFood(),
            profile.getFavDrink(),
            profile.getFavShow(),
            byBucket,
            recentInteractions.size(),
            todayInteractions,
            wellbeingEntriesLast7Days,
            painEventsLast7Days,
            avgSeverity,
            painByBodyArea
        );
    }

    private static TimeBucket bucketForInstant(Instant instant, ZoneId zone) {
        LocalTime time = instant.atZone(zone).toLocalTime();
        int hour = time.getHour();

        if (hour >= 6 && hour < 12) {
            return TimeBucket.MORNING;
        } else if (hour >= 12 && hour < 18) {
            return TimeBucket.AFTERNOON;
        } else if (hour >= 18 && hour < 23) {
            return TimeBucket.EVENING;
        } else {
            return TimeBucket.NIGHT;
        }
    }

    private static Instant resolveSince(Instant now, String periodRaw) {
        String period = normalizePeriod(periodRaw);
        return switch (period) {
            case "DAY" -> now.minus(Duration.ofDays(1));
            case "WEEK" -> now.minus(Duration.ofDays(7));
            case "MONTH" -> now.minus(Duration.ofDays(30));
            case "3_MONTHS" -> now.minus(Duration.ofDays(90));
            case "6_MONTHS" -> now.minus(Duration.ofDays(180));
            case "9_MONTHS" -> now.minus(Duration.ofDays(270));
            case "YEAR" -> now.minus(Duration.ofDays(365));
            default -> now.minus(Duration.ofDays(7));
        };
    }

    private static String normalizePeriod(String raw) {
        if (raw == null) return "WEEK";
        String s = raw.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        return switch (s) {
            case "1D", "TODAY", "DAY" -> "DAY";
            case "7D", "WEEK" -> "WEEK";
            case "30D", "MONTH" -> "MONTH";
            case "3M", "3MONTHS", "3_MONTHS" -> "3_MONTHS";
            case "6M", "6MONTHS", "6_MONTHS" -> "6_MONTHS";
            case "9M", "9MONTHS", "9_MONTHS" -> "9_MONTHS";
            case "12M", "365D", "YEAR" -> "YEAR";
            default -> s;
        };
    }
}

