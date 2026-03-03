package com.sophie.aac.auth.bootstrap;

import com.sophie.aac.auth.domain.CaregiverAccountEntity;
import com.sophie.aac.auth.domain.Role;
import com.sophie.aac.auth.repository.CaregiverAccountRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AuthAccountSeeder {

  private final CaregiverAccountRepository repo;
  private final PasswordEncoder encoder;

  @Value("${PARENT_PIN:1234}") private String parentPin;
  @Value("${CARER_PIN:2345}") private String carerPin;
  @Value("${CLINICIAN_PIN:3456}") private String clinicianPin;

  public AuthAccountSeeder(CaregiverAccountRepository repo, PasswordEncoder encoder) {
    this.repo = repo;
    this.encoder = encoder;
  }

  @EventListener(ApplicationReadyEvent.class)
  public void seed() {
    seedRole(Role.PARENT, parentPin);
    seedRole(Role.CARER, carerPin);
    seedRole(Role.CLINICIAN, clinicianPin);
  }

  private void seedRole(Role role, String pin) {
    repo.findByRole(role).ifPresentOrElse(
        existing -> {
          // Keep the demo accounts in sync with the configured PINs
          existing.setPinHash(encoder.encode(pin));
          existing.setActive(true);
          repo.save(existing);
        },
        () -> {
          CaregiverAccountEntity a = new CaregiverAccountEntity();
          a.setId(UUID.randomUUID());
          a.setRole(role);
          a.setPinHash(encoder.encode(pin));
          a.setActive(true);
          a.setCreatedAt(Instant.now());
          repo.save(a);
        }
    );
  }
}