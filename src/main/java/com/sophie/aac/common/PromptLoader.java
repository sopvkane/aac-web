package com.sophie.aac.common;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public final class PromptLoader {
  private PromptLoader() {}

  public static String load(String classpathPath) {
    try (InputStream is = PromptLoader.class.getClassLoader().getResourceAsStream(classpathPath)) {
      if (is == null) {
        throw new IllegalStateException("Prompt not found on classpath: " + classpathPath);
      }
      return new String(is.readAllBytes(), StandardCharsets.UTF_8);
    } catch (Exception e) {
      throw new IllegalStateException("Failed to load prompt: " + classpathPath, e);
    }
  }
}