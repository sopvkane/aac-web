package com.sophie.aac.profile.controller;

import com.sophie.aac.profile.domain.UserProfileEntity;
import com.sophie.aac.profile.service.CaregiverProfileService;
import com.sophie.aac.profile.web.UpdateUserProfileRequest;
import com.sophie.aac.profile.web.UserProfileResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/carer/profile")
public class CarerProfileController {

  private final CaregiverProfileService service;

  public CarerProfileController(CaregiverProfileService service) {
    this.service = service;
  }

  @GetMapping
  public UserProfileResponse get() {
    return toResponse(service.get());
  }

  @PutMapping
  public UserProfileResponse update(@RequestBody @Valid UpdateUserProfileRequest req) {
    return toResponse(service.update(req));
  }

  private static UserProfileResponse toResponse(UserProfileEntity p) {
    return new UserProfileResponse(
        p.getId(),
        p.getDisplayName(),
        p.getWakeName(),
        p.isDetailsDefault(),
        p.isVoiceDefault(),
        p.isAiEnabled(),
        p.isMemoryEnabled(),
        p.isAnalyticsEnabled(),
        p.getDefaultLocation(),
        p.isAllowHome(),
        p.isAllowSchool(),
        p.isAllowWork(),
        p.isAllowOther(),
        p.getMaxOptions(),
        p.getFavFood(),
        p.getFavDrink(),
        p.getFavShow(),
        p.getFavTopic(),
        p.getAboutUser(),
        p.getSchoolDays(),
        p.getLunchTime(),
        p.getDinnerTime(),
        p.getBedTime(),
        p.getFamilyNotes(),
        p.getClassmates(),
        p.getTeachers(),
        p.getSchoolActivities(),
        p.getUpdatedAt()
    );
  }
}