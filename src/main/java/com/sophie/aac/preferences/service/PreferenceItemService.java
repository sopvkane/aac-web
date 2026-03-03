package com.sophie.aac.preferences.service;

import com.sophie.aac.preferences.domain.PreferenceItemEntity;
import com.sophie.aac.preferences.repository.PreferenceItemRepository;
import com.sophie.aac.preferences.web.PreferenceItemRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class PreferenceItemService {

    private final PreferenceItemRepository repo;

    public PreferenceItemService(PreferenceItemRepository repo) {
        this.repo = repo;
    }

    public List<PreferenceItemEntity> listByKind(String kind) {
        return repo.findByKindOrderByPriorityDescLabelAsc(kind.toUpperCase());
    }

    @Transactional
    public PreferenceItemEntity create(PreferenceItemRequest req, String createdByRole) {
        PreferenceItemEntity e = new PreferenceItemEntity();
        e.setId(UUID.randomUUID());
        e.setKind(req.kind().toUpperCase());
        e.setLabel(req.label().trim());
        e.setCategory(trimOrNull(req.category()));
        e.setTags(trimOrNull(req.tags()));
        e.setImageUrl(trimOrNull(req.imageUrl()));
        e.setScope(req.scope().toUpperCase());
        e.setPriority(req.priority() != null ? req.priority() : 0);
        e.setCreatedByRole(createdByRole);
        Instant now = Instant.now();
        e.setCreatedAt(now);
        e.setUpdatedAt(now);
        return repo.save(e);
    }

    @Transactional
    public PreferenceItemEntity update(UUID id, PreferenceItemRequest req) {
        PreferenceItemEntity e = repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Preference item not found"));

        e.setKind(req.kind().toUpperCase());
        e.setLabel(req.label().trim());
        e.setCategory(trimOrNull(req.category()));
        e.setTags(trimOrNull(req.tags()));
        e.setImageUrl(trimOrNull(req.imageUrl()));
        e.setScope(req.scope().toUpperCase());
        if (req.priority() != null) {
            e.setPriority(req.priority());
        }
        e.setUpdatedAt(Instant.now());
        return repo.save(e);
    }

    @Transactional
    public void delete(UUID id) {
        repo.deleteById(id);
    }

    private static String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}

