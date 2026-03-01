package com.sophie.aac.auth.security;

import com.sophie.aac.auth.domain.AuthSessionEntity;
import com.sophie.aac.auth.domain.Role;
import com.sophie.aac.auth.repository.AuthSessionRepository;
import com.sophie.aac.auth.service.AuthService;
import com.sophie.aac.auth.util.TokenHash;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
class SecurityIntegrationTest {

  @Autowired private WebApplicationContext context;
  @Autowired private AuthSessionRepository sessions;

  private MockMvc mvc;

  @BeforeEach
  void setUp() {
    sessions.deleteAll();
    mvc = MockMvcBuilders
        .webAppContextSetup(context)
        .apply(springSecurity())
        .build();
  }

  @Test
  void carer_profile_requires_auth() throws Exception {
    mvc.perform(get("/api/carer/profile"))
        .andExpect(status().isForbidden()); // anonymous -> forbidden with current config
  }

  @Test
  void carer_profile_allows_parent_when_cookie_session_valid() throws Exception {
    String rawToken = "test.token.value";

    AuthSessionEntity s = new AuthSessionEntity();
    s.setId(UUID.randomUUID());
    s.setRole(Role.PARENT);
    s.setTokenHash(TokenHash.sha256Hex(rawToken));
    s.setCreatedAt(Instant.now());
    s.setExpiresAt(Instant.now().plusSeconds(3600));
    sessions.save(s);

    mvc.perform(get("/api/carer/profile")
            .cookie(new Cookie(AuthService.COOKIE_NAME, rawToken)))
        .andExpect(status().isOk());
  }

  @Test
  void clinician_role_cannot_access_carer_endpoint() throws Exception {
    String rawToken = "clinician.token.value";

    AuthSessionEntity s = new AuthSessionEntity();
    s.setId(UUID.randomUUID());
    s.setRole(Role.CLINICIAN);
    s.setTokenHash(TokenHash.sha256Hex(rawToken));
    s.setCreatedAt(Instant.now());
    s.setExpiresAt(Instant.now().plusSeconds(3600));
    sessions.save(s);

    mvc.perform(get("/api/carer/profile")
            .cookie(new Cookie(AuthService.COOKIE_NAME, rawToken)))
        .andExpect(status().isForbidden());
  }
}