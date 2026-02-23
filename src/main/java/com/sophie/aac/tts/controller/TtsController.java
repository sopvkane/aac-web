package com.sophie.aac.tts.controller;

import com.sophie.aac.tts.service.TtsService;
import com.sophie.aac.tts.web.TtsRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tts")
public class TtsController {

    private final TtsService ttsService;

    public TtsController(TtsService ttsService) {
        this.ttsService = ttsService;
    }

    @PostMapping(produces = "audio/mpeg")
    public ResponseEntity<byte[]> speak(@RequestBody TtsRequest request) {
        byte[] audio = ttsService.synthesizeMp3(request.text(), request.voice());

        return ResponseEntity.ok()
            .contentType(MediaType.valueOf("audio/mpeg"))
            .cacheControl(CacheControl.noStore())
            .body(audio);
    }
}