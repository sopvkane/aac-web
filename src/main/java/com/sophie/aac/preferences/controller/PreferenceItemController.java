package com.sophie.aac.preferences.controller;

import com.sophie.aac.auth.domain.Role;
import com.sophie.aac.preferences.domain.PreferenceItemEntity;
import com.sophie.aac.preferences.service.PreferenceItemService;
import com.sophie.aac.preferences.web.PreferenceItemRequest;
import com.sophie.aac.preferences.web.PreferenceItemResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/carer/preferences")
public class PreferenceItemController {

    private final PreferenceItemService service;

    public PreferenceItemController(PreferenceItemService service) {
        this.service = service;
    }

    @GetMapping
    public List<PreferenceItemResponse> list(@RequestParam String kind) {
        return service.listByKind(kind).stream().map(PreferenceItemController::toResponse).toList();
    }

    @PostMapping
    public PreferenceItemResponse create(@RequestBody @Valid PreferenceItemRequest req) {
        // For now we record a generic role; hook into Spring Security later if needed.
        PreferenceItemEntity e = service.create(req, Role.PARENT.name());
        return toResponse(e);
    }

    @PutMapping("/{id}")
    public PreferenceItemResponse update(@PathVariable UUID id, @RequestBody @Valid PreferenceItemRequest req) {
        PreferenceItemEntity e = service.update(id, req);
        return toResponse(e);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    private static PreferenceItemResponse toResponse(PreferenceItemEntity e) {
        return new PreferenceItemResponse(
            e.getId(),
            e.getKind(),
            e.getLabel(),
            e.getCategory(),
            e.getTags(),
            e.getImageUrl(),
            e.getScope(),
            e.getPriority()
        );
    }
}

