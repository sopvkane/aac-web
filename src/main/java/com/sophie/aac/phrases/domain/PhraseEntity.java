package com.sophie.aac.phrases.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "phrases")
public class PhraseEntity {

  @Id
  private UUID id;

  @Column(nullable = false, length = 280)
  private String text;

  @Column(nullable = false, length = 50)
  private String category;

  public PhraseEntity() {}

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getText() {
    return text;
  }

  public void setText(String text) {
    this.text = text;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }
}
