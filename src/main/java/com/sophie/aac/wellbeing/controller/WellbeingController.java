package com.sophie.aac.wellbeing.controller;

import com.sophie.aac.wellbeing.service.WellbeingService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

record MoodRequest(@Min(1) @Max(5) int moodScore) {}

record PainRequest(@NotBlank String bodyArea, @Min(1) @Max(10) int severity, String notes) {}

@RestController
@RequestMapping("/api/wellbeing")
public class WellbeingController {

    private final WellbeingService service;

    public WellbeingController(WellbeingService service) {
        this.service = service;
    }

    @PostMapping("/mood")
    public void recordMood(@RequestBody MoodRequest req) {
        service.recordMood(req.moodScore());
    }

    @PostMapping("/pain")
    public void recordPain(@RequestBody PainRequest req) {
        service.recordPain(req.bodyArea(), req.severity(), req.notes());
    }
}

