package com.sophie.aac.profile.service;

import com.sophie.aac.profile.domain.UserProfileEntity;
import com.sophie.aac.profile.repository.UserProfileRepository;
import com.sophie.aac.profile.web.UpdateUserProfileRequest;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CaregiverProfileService {

  public static final UUID DEFAULT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

  private final UserProfileRepository repo;

  public CaregiverProfileService(UserProfileRepository repo) {
    this.repo = repo;
  }

  public UserProfileEntity get() {
    return repo.findById(DEFAULT_ID)
        .orElseThrow(() -> new IllegalStateException("Default user_profile row missing."));
  }

  @Transactional
  public UserProfileEntity update(UpdateUserProfileRequest r) {
    UserProfileEntity p = get();

    p.setDisplayName(r.displayName());
    p.setWakeName(r.wakeName());
    p.setDetailsDefault(r.detailsDefault());
    p.setVoiceDefault(r.voiceDefault());

    p.setAiEnabled(r.aiEnabled());
    p.setMemoryEnabled(r.memoryEnabled());
    p.setAnalyticsEnabled(r.analyticsEnabled());

    p.setDefaultLocation(r.defaultLocation());
    p.setAllowHome(r.allowHome());
    p.setAllowSchool(r.allowSchool());
    p.setAllowWork(r.allowWork());
    p.setAllowOther(r.allowOther());
    p.setMaxOptions(r.maxOptions());

    p.setFavFood(r.favFood());
    p.setFavDrink(r.favDrink());
    p.setFavShow(r.favShow());
    p.setFavTopic(r.favTopic());

    p.setAboutUser(r.aboutUser());
    p.setSchoolDays(r.schoolDays());
    p.setLunchTime(r.lunchTime());
    p.setDinnerTime(r.dinnerTime());
    p.setBedTime(r.bedTime());

    p.setFamilyNotes(r.familyNotes());
    p.setClassmates(r.classmates());
    p.setTeachers(r.teachers());
    p.setSchoolActivities(r.schoolActivities());

    p.setUpdatedAt(Instant.now());
    return repo.save(p);
  }
}