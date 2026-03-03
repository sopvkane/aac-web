package com.sophie.aac.auth.security;

import com.sophie.aac.auth.domain.AuthSessionEntity;
import com.sophie.aac.auth.domain.Role;
import com.sophie.aac.auth.repository.AuthSessionRepository;
import com.sophie.aac.auth.service.AuthService;
import com.sophie.aac.auth.util.TokenHash;
import com.sophie.aac.profile.domain.UserProfileEntity;
import com.sophie.aac.profile.repository.UserProfileRepository;
import com.sophie.aac.profile.service.CaregiverProfileService;
import com.sophie.aac.suggestions.domain.LocationCategory;
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

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.MOCK,
    properties = {
        // Use in-memory H2 for this integration test so it does not depend on an
        // external Postgres instance in CI or local environments.
        "spring.datasource.url=jdbc:h2:mem:aac_security_it;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false"
    }
)
class SecurityIntegrationTest {

  @Autowired private WebApplicationContext context;
  @Autowired private AuthSessionRepository sessions;
  @Autowired private UserProfileRepository profiles;

  private MockMvc mvc;

  @BeforeEach
  void setUp() {
    sessions.deleteAll();
    ensureDefaultProfileRow();
    mvc = MockMvcBuilders
        .webAppContextSetup(context)
        .apply(springSecurity())
        .build();
  }

  private void ensureDefaultProfileRow() {
    if (profiles.existsById(CaregiverProfileService.DEFAULT_ID)) {
      return;
    }
    UserProfileEntity p = new UserProfileEntity();
    p.setId(CaregiverProfileService.DEFAULT_ID);
    p.setDisplayName("Test User");
    p.setWakeName("Test");
    p.setDetailsDefault(true);
    p.setVoiceDefault(true);
    p.setAiEnabled(true);
    p.setMemoryEnabled(true);
    p.setAnalyticsEnabled(true);
    p.setDefaultLocation(LocationCategory.HOME);
    p.setAllowHome(true);
    p.setAllowSchool(true);
    p.setAllowWork(false);
    p.setAllowOther(true);
    p.setMaxOptions(3);
    p.setUpdatedAt(java.time.Instant.now());
    profiles.save(p);
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