package com.sophie.aac.wellbeing.service;

import com.sophie.aac.analytics.domain.WellbeingEntryEntity;
import com.sophie.aac.analytics.repository.WellbeingEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class WellbeingService {

    private final WellbeingEntryRepository repo;

    public WellbeingService(WellbeingEntryRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public void recordMood(int moodScore) {
        WellbeingEntryEntity e = new WellbeingEntryEntity();
        e.setId(UUID.randomUUID());
        e.setMoodScore(moodScore);
        e.setCreatedAt(Instant.now());
        repo.save(e);
    }

    @Transactional
    public void recordPain(String bodyArea, Integer severity, String notes) {
        WellbeingEntryEntity e = new WellbeingEntryEntity();
        e.setId(UUID.randomUUID());
        e.setSymptomType("PAIN");
        e.setBodyArea(bodyArea);
        e.setSeverity(severity);
        e.setNotes(notes);
        e.setCreatedAt(Instant.now());
        repo.save(e);
    }
}

