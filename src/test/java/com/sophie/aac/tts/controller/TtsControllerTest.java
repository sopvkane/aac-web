package com.sophie.aac.tts.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sophie.aac.tts.service.TtsService;
import com.sophie.aac.tts.web.TtsRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TtsControllerTest {

    private MockMvc mvc;
    private ObjectMapper objectMapper;
    private TtsService ttsService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        ttsService = mock(TtsService.class);
        mvc = MockMvcBuilders.standaloneSetup(new TtsController(ttsService)).build();
    }

    @Test
    void returns_audio_mpeg_bytes() throws Exception {
        byte[] fakeMp3 = new byte[] {0x00, 0x01, 0x02};

        when(ttsService.synthesizeMp3("Hi Sophie", null)).thenReturn(fakeMp3);

        mvc.perform(post("/api/tts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new TtsRequest("Hi Sophie", null))))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type", "audio/mpeg"))
            .andExpect(content().bytes(fakeMp3));

        verify(ttsService).synthesizeMp3("Hi Sophie", null);
    }
}