package com.sophie.aac.profile.domain;

import com.sophie.aac.suggestions.domain.LocationCategory;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_profile")
public class UserProfileEntity {

  @Id
  private UUID id;

  @Column(nullable = false, length = 50)
  private String displayName;

  @Column(nullable = false, length = 50)
  private String wakeName;

  @Column(nullable = false)
  private boolean detailsDefault;

  @Column(nullable = false)
  private boolean voiceDefault;

  @Column(nullable = false)
  private boolean aiEnabled;

  @Column(nullable = false)
  private boolean memoryEnabled;

  @Column(nullable = false)
  private boolean analyticsEnabled;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private LocationCategory defaultLocation;

  @Column(nullable = false) private boolean allowHome;
  @Column(nullable = false) private boolean allowSchool;
  @Column(nullable = false) private boolean allowWork;
  @Column(nullable = false) private boolean allowOther;

  @Column(nullable = false)
  private int maxOptions;

  @Column(length = 50) private String favFood;
  @Column(length = 50) private String favDrink;
  @Column(length = 50) private String favShow;
  @Column(length = 50) private String favTopic;

  @Column(length = 500) private String aboutUser;

  @Column(length = 32) private String schoolDays;
  @Column(length = 8) private String lunchTime;
  @Column(length = 8) private String dinnerTime;
  @Column(length = 8) private String bedTime;

  @Column(length = 280) private String familyNotes;
  @Column(length = 280) private String classmates;
  @Column(length = 280) private String teachers;
  @Column(length = 280) private String schoolActivities;

  @Column(nullable = false)
  private Instant updatedAt;

  // getters/setters (generate in IDE)
  public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }
  public String getDisplayName() { return displayName; }
  public void setDisplayName(String displayName) { this.displayName = displayName; }
  public String getWakeName() { return wakeName; }
  public void setWakeName(String wakeName) { this.wakeName = wakeName; }
  public boolean isDetailsDefault() { return detailsDefault; }
  public void setDetailsDefault(boolean detailsDefault) { this.detailsDefault = detailsDefault; }
  public boolean isVoiceDefault() { return voiceDefault; }
  public void setVoiceDefault(boolean voiceDefault) { this.voiceDefault = voiceDefault; }
  public boolean isAiEnabled() { return aiEnabled; }
  public void setAiEnabled(boolean aiEnabled) { this.aiEnabled = aiEnabled; }
  public boolean isMemoryEnabled() { return memoryEnabled; }
  public void setMemoryEnabled(boolean memoryEnabled) { this.memoryEnabled = memoryEnabled; }
  public boolean isAnalyticsEnabled() { return analyticsEnabled; }
  public void setAnalyticsEnabled(boolean analyticsEnabled) { this.analyticsEnabled = analyticsEnabled; }
  public LocationCategory getDefaultLocation() { return defaultLocation; }
  public void setDefaultLocation(LocationCategory defaultLocation) { this.defaultLocation = defaultLocation; }
  public boolean isAllowHome() { return allowHome; }
  public void setAllowHome(boolean allowHome) { this.allowHome = allowHome; }
  public boolean isAllowSchool() { return allowSchool; }
  public void setAllowSchool(boolean allowSchool) { this.allowSchool = allowSchool; }
  public boolean isAllowWork() { return allowWork; }
  public void setAllowWork(boolean allowWork) { this.allowWork = allowWork; }
  public boolean isAllowOther() { return allowOther; }
  public void setAllowOther(boolean allowOther) { this.allowOther = allowOther; }
  public int getMaxOptions() { return maxOptions; }
  public void setMaxOptions(int maxOptions) { this.maxOptions = maxOptions; }
  public String getFavFood() { return favFood; }
  public void setFavFood(String favFood) { this.favFood = favFood; }
  public String getFavDrink() { return favDrink; }
  public void setFavDrink(String favDrink) { this.favDrink = favDrink; }
  public String getFavShow() { return favShow; }
  public void setFavShow(String favShow) { this.favShow = favShow; }
  public String getFavTopic() { return favTopic; }
  public void setFavTopic(String favTopic) { this.favTopic = favTopic; }
  public String getAboutUser() { return aboutUser; }
  public void setAboutUser(String aboutUser) { this.aboutUser = aboutUser; }
  public String getSchoolDays() { return schoolDays; }
  public void setSchoolDays(String schoolDays) { this.schoolDays = schoolDays; }
  public String getLunchTime() { return lunchTime; }
  public void setLunchTime(String lunchTime) { this.lunchTime = lunchTime; }
  public String getDinnerTime() { return dinnerTime; }
  public void setDinnerTime(String dinnerTime) { this.dinnerTime = dinnerTime; }
  public String getBedTime() { return bedTime; }
  public void setBedTime(String bedTime) { this.bedTime = bedTime; }
  public String getFamilyNotes() { return familyNotes; }
  public void setFamilyNotes(String familyNotes) { this.familyNotes = familyNotes; }
  public String getClassmates() { return classmates; }
  public void setClassmates(String classmates) { this.classmates = classmates; }
  public String getTeachers() { return teachers; }
  public void setTeachers(String teachers) { this.teachers = teachers; }
  public String getSchoolActivities() { return schoolActivities; }
  public void setSchoolActivities(String schoolActivities) { this.schoolActivities = schoolActivities; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}