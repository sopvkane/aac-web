package com.sophie.aac.analytics.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wellbeing_entry")
public class WellbeingEntryEntity {

    @Id
    private UUID id;

    @Column(name = "mood_score")
    private Integer moodScore;

    @Column(name = "symptom_type", length = 32)
    private String symptomType;

    @Column(name = "body_area", length = 32)
    private String bodyArea;

    @Column(name = "severity")
    private Integer severity;

    @Column(name = "notes", length = 280)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Integer getMoodScore() {
        return moodScore;
    }

    public void setMoodScore(Integer moodScore) {
        this.moodScore = moodScore;
    }

    public String getSymptomType() {
        return symptomType;
    }

    public void setSymptomType(String symptomType) {
        this.symptomType = symptomType;
    }

    public String getBodyArea() {
        return bodyArea;
    }

    public void setBodyArea(String bodyArea) {
        this.bodyArea = bodyArea;
    }

    public Integer getSeverity() {
        return severity;
    }

    public void setSeverity(Integer severity) {
        this.severity = severity;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

