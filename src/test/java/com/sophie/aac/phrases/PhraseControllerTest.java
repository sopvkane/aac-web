package com.sophie.aac.phrases;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sophie.aac.common.web.ApiExceptionHandler;
import com.sophie.aac.phrases.controller.PhraseController;
import com.sophie.aac.phrases.domain.PhraseEntity;
import com.sophie.aac.phrases.service.PhraseService;
import com.sophie.aac.phrases.web.CreatePhraseRequest;
import com.sophie.aac.phrases.web.UpdatePhraseRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller contract tests using standalone MockMvc:
 * - no Spring context
 * - no DB / JPA
 * - verifies JSON + status codes + that controller passes params to service correctly
 *
 * Includes validation + ProblemDetail mapping via ApiExceptionHandler.
 */
class PhraseControllerTest {

  private MockMvc mvc;
  private ObjectMapper objectMapper;
  private PhraseService phraseService;

  @BeforeEach
  void setUp() {
    objectMapper = new ObjectMapper();
    phraseService = mock(PhraseService.class);

    // Ensure @Valid is actually enforced in standalone MockMvc
    LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
    validator.afterPropertiesSet();

    mvc =
        MockMvcBuilders
            .standaloneSetup(new PhraseController(phraseService))
            .setControllerAdvice(new ApiExceptionHandler())
            .setValidator(validator)
            .build();
  }

  @Test
  void create_then_list_filters_work() throws Exception {
    // create 1
    UUID id1 = UUID.randomUUID();
    PhraseEntity p1 = new PhraseEntity();
    p1.setId(id1);
    p1.setText("Hello world");
    p1.setCategory("greeting");

    when(phraseService.create("Hello world", "greeting")).thenReturn(p1);

    mvc.perform(
            post("/api/phrases")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreatePhraseRequest("Hello world", "greeting"))))
        .andExpect(status().isCreated())
        .andExpect(header().string("Location", "/api/phrases/" + id1))
        .andExpect(jsonPath("$.id").value(id1.toString()))
        .andExpect(jsonPath("$.text").value("Hello world"))
        .andExpect(jsonPath("$.category").value("greeting"));

    // create 2
    UUID id2 = UUID.randomUUID();
    PhraseEntity p2 = new PhraseEntity();
    p2.setId(id2);
    p2.setText("I want tea");
    p2.setCategory("needs");

    when(phraseService.create("I want tea", "needs")).thenReturn(p2);

    mvc.perform(
            post("/api/phrases")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreatePhraseRequest("I want tea", "needs"))))
        .andExpect(status().isCreated())
        .andExpect(header().string("Location", "/api/phrases/" + id2))
        .andExpect(jsonPath("$.id").value(id2.toString()));

    // list all
    when(phraseService.list(Optional.empty(), Optional.empty())).thenReturn(List.of(p1, p2));

    mvc.perform(get("/api/phrases"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[*].text", hasItems("Hello world", "I want tea")));

    // filter q
    when(phraseService.list(Optional.of("tea"), Optional.empty())).thenReturn(List.of(p2));

    mvc.perform(get("/api/phrases").param("q", "tea"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].text").value("I want tea"));

    // filter category
    when(phraseService.list(Optional.empty(), Optional.of("greeting"))).thenReturn(List.of(p1));

    mvc.perform(get("/api/phrases").param("category", "greeting"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].category").value("greeting"));

    verify(phraseService).list(Optional.empty(), Optional.empty());
    verify(phraseService).list(Optional.of("tea"), Optional.empty());
    verify(phraseService).list(Optional.empty(), Optional.of("greeting"));
  }

  @Test
  void get_by_id_returns_phrase() throws Exception {
    UUID id = UUID.randomUUID();
    PhraseEntity p = new PhraseEntity();
    p.setId(id);
    p.setText("Yes");
    p.setCategory("affirmation");

    when(phraseService.get(id)).thenReturn(p);

    mvc.perform(get("/api/phrases/{id}", id))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(id.toString()))
        .andExpect(jsonPath("$.text").value("Yes"))
        .andExpect(jsonPath("$.category").value("affirmation"));

    verify(phraseService).get(id);
  }

  @Test
  void put_updates_phrase_and_returns_updated_resource() throws Exception {
    UUID id = UUID.randomUUID();
    PhraseEntity updated = new PhraseEntity();
    updated.setId(id);
    updated.setText("Updated text");
    updated.setCategory("updated-category");

    when(phraseService.update(id, "Updated text", "updated-category")).thenReturn(updated);

    mvc.perform(
            put("/api/phrases/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdatePhraseRequest("Updated text", "updated-category"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(id.toString()))
        .andExpect(jsonPath("$.text").value("Updated text"))
        .andExpect(jsonPath("$.category").value("updated-category"));

    verify(phraseService).update(id, "Updated text", "updated-category");
  }

  @Test
  void delete_calls_service_and_returns_204() throws Exception {
    UUID id = UUID.randomUUID();
    doNothing().when(phraseService).delete(id);

    mvc.perform(delete("/api/phrases/{id}", id))
        .andExpect(status().isNoContent());

    verify(phraseService).delete(id);
  }

  @Test
  void create_blank_fields_returns_400_problem_detail_with_errors() throws Exception {
    mvc.perform(
            post("/api/phrases")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreatePhraseRequest("", ""))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.title").value("Validation failed"))
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.detail").value("Request body did not pass validation."))
        .andExpect(jsonPath("$.errors.text", containsString("must not be blank")))
        .andExpect(jsonPath("$.errors.category", containsString("must not be blank")));

    verifyNoInteractions(phraseService);
  }

  @Test
  void create_category_too_long_returns_400() throws Exception {
    String tooLongCategory = "a".repeat(51); // expects @Size(max=50)

    mvc.perform(
            post("/api/phrases")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreatePhraseRequest("Hello", tooLongCategory))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.category", containsString("between 0 and 50")));

    verifyNoInteractions(phraseService);
  }

  @Test
  void update_text_too_long_returns_400() throws Exception {
    UUID id = UUID.randomUUID();
    String tooLongText = "a".repeat(281); // expects @Size(max=280)

    mvc.perform(
            put("/api/phrases/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdatePhraseRequest(tooLongText, "general"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.text", containsString("between 0 and 280")));

    verifyNoInteractions(phraseService);
  }
}