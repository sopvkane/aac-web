package com.sophie.aac.analytics.domain;

import com.sophie.aac.suggestions.domain.LocationCategory;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "interaction_event")
public class InteractionEventEntity {

    @Id
    private UUID id;

    @Column(name = "event_type", nullable = false, length = 32)
    private String eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "location", nullable = false, length = 16)
    private LocationCategory location;

    @Column(name = "prompt_type", length = 32)
    private String promptType;

    @Column(name = "selected_text", length = 280)
    private String selectedText;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public LocationCategory getLocation() {
        return location;
    }

    public void setLocation(LocationCategory location) {
        this.location = location;
    }

    public String getPromptType() {
        return promptType;
    }

    public void setPromptType(String promptType) {
        this.promptType = promptType;
    }

    public String getSelectedText() {
        return selectedText;
    }

    public void setSelectedText(String selectedText) {
        this.selectedText = selectedText;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

