package com.sophie.aac.dialogue.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sophie.aac.common.PromptLoader;
import com.sophie.aac.dialogue.web.DialogueRequest;
import com.sophie.aac.dialogue.web.DialogueResponse;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DialogueService {

  private static final String SYSTEM_PROMPT =
      PromptLoader.load("prompts/dialogue-system.txt");

  private final AiReplyClient ai;
  private final UserProfileService userProfileService;
  private final ObjectMapper mapper;

  public DialogueService(AiReplyClient ai, UserProfileService userProfileService, ObjectMapper mapper) {
    this.ai = ai;
    this.userProfileService = userProfileService;
    this.mapper = mapper;
  }

  public DialogueResponse generateReplies(DialogueRequest req) {
    String name = safe(req.userName());
    String q = safe(req.questionText());
    UserProfileService.UserProfile profile = userProfileService.loadProfileOrDefault();

    if (!ai.isConfigured()) {
      return fallback("AI_NOT_CONFIGURED", null);
    }

    String user = buildUserPrompt(name, q, profile, req.memory());

    try {
      String content = ai.generateJson(SYSTEM_PROMPT, user);
      if (content == null || content.isBlank()) {
        return fallback("AI_EMPTY", null);
      }

      String extracted = extractFirstJsonObject(content);

      Map<String, Object> root = mapper.readValue(
          extracted,
          new TypeReference<Map<String, Object>>() {}
      );

      String intent = asString(root.get("intent"), "other");

      List<Map<String, Object>> top = asListOfMaps(root.get("topReplies"));
      List<Map<String, Object>> groups = asListOfMaps(root.get("optionGroups"));

      List<DialogueResponse.Reply> replies = parseReplies(top);
      replies = ensureExactly3Replies(replies);

      List<DialogueResponse.OptionGroup> optionGroups = parseOptionGroups(groups);

      DialogueResponse.Memory memory = new DialogueResponse.Memory(
          intent,
          q,
          optionGroups
      );

      Map<String, Object> debug = new LinkedHashMap<>();
      debug.put("mode", "AI");
      debug.put("intent", intent);

      return new DialogueResponse(
          intent,
          replies,
          optionGroups,
          memory,
          debug
      );
    } catch (Exception e) {
      return fallback("AI_PARSE_OR_CALL_FAIL", safeMessage(e));
    }
  }

  private static String buildUserPrompt(
      String userName,
      String question,
      UserProfileService.UserProfile profile,
      DialogueRequest.ConversationMemory mem
  ) {
    StringBuilder sb = new StringBuilder();

    sb.append("userName: ").append(userName).append("\n");
    sb.append("questionText: ").append(question).append("\n\n");

    // Keep these as "style preferences" only, not as a required structure.
    sb.append("stylePreferences:\n");
    sb.append("- yesPrefix: ").append(profile.yesPrefix()).append("\n");
    sb.append("- noText: ").append(profile.noText()).append("\n");
    sb.append("- repeatText: ").append(profile.repeatText()).append("\n\n");

    sb.append("profilePreferences:\n");
    sb.append("- likedFoods: ").append(profile.likedFoods()).append("\n");
    sb.append("- dislikedFoods: ").append(profile.dislikedFoods()).append("\n");
    sb.append("- likedDrinks: ").append(profile.likedDrinks()).append("\n");
    sb.append("- dislikedDrinks: ").append(profile.dislikedDrinks()).append("\n\n");

    if (mem != null) {
      sb.append("conversationMemory:\n");
      sb.append("- lastIntent: ").append(mem.lastIntent()).append("\n");
      sb.append("- lastQuestionText: ").append(mem.lastQuestionText()).append("\n");
      sb.append("- lastOptionGroups: ").append(mem.lastOptionGroups()).append("\n");
    } else {
      sb.append("conversationMemory: none\n");
    }

    return sb.toString();
  }

  private static List<DialogueResponse.Reply> parseReplies(List<Map<String, Object>> top) {
    List<DialogueResponse.Reply> replies = new ArrayList<>();

    for (Map<String, Object> r : top) {
      String id = asString(r.get("id"), UUID.randomUUID().toString());
      String label = asString(r.get("label"), "Option");
      String text = asString(r.get("text"), "");

      if (!text.isBlank()) {
        replies.add(new DialogueResponse.Reply(id, label, text));
      }
    }

    return replies;
  }

  private static List<DialogueResponse.Reply> ensureExactly3Replies(List<DialogueResponse.Reply> in) {
    List<DialogueResponse.Reply> out = new ArrayList<>();
    if (in != null) out.addAll(in);

    // Truncate if more than 3
    if (out.size() > 3) {
      return out.subList(0, 3);
    }

    // Pad if less than 3 (do NOT force yes/no/instead)
    while (out.size() < 3) {
      int idx = out.size() + 1;
      if (idx == 1) {
        out.add(new DialogueResponse.Reply("r1", "Again", "Can you say it again, please?"));
      } else if (idx == 2) {
        out.add(new DialogueResponse.Reply("r2", "Show me", "Can you show me, please?"));
      } else {
        out.add(new DialogueResponse.Reply("r3", "Help", "Can you help me, please?"));
      }
    }

    return out;
  }

  private static List<DialogueResponse.OptionGroup> parseOptionGroups(List<Map<String, Object>> groups) {
    List<DialogueResponse.OptionGroup> optionGroups = new ArrayList<>();

    for (Map<String, Object> g : groups) {
      optionGroups.add(new DialogueResponse.OptionGroup(
          asString(g.get("id"), "options"),
          asString(g.get("title"), "More options"),
          asStringList(g.get("items"))
      ));
    }

    return optionGroups;
  }

  private DialogueResponse fallback(String reason, String error) {
    var replies = List.of(
        new DialogueResponse.Reply("r1", "Again", "Can you say it again, please?"),
        new DialogueResponse.Reply("r2", "Show me", "Can you show me, please?"),
        new DialogueResponse.Reply("r3", "Help", "Can you help me, please?")
    );

    Map<String, Object> debug = new LinkedHashMap<>();
    debug.put("mode", "FALLBACK");
    debug.put("reason", reason);
    if (error != null && !error.isBlank()) debug.put("error", error);

    DialogueResponse.Memory memory = new DialogueResponse.Memory("other", "", List.of());

    return new DialogueResponse(
        "other",
        replies,
        List.of(),
        memory,
        debug
    );
  }

  private static String safe(String s) {
    return s == null ? "" : s.trim();
  }

  private static String asString(Object value, String fallback) {
    String s = value == null ? "" : value.toString().trim();
    return s.isBlank() ? fallback : s;
  }

  @SuppressWarnings("unchecked")
  private static List<Map<String, Object>> asListOfMaps(Object value) {
    if (value instanceof List<?> list) {
      List<Map<String, Object>> out = new ArrayList<>();
      for (Object o : list) {
        if (o instanceof Map<?, ?> m) {
          Map<String, Object> converted = new LinkedHashMap<>();
          for (var e : m.entrySet()) {
            if (e.getKey() != null) converted.put(e.getKey().toString(), e.getValue());
          }
          out.add(converted);
        }
      }
      return out;
    }
    return List.of();
  }

  private static List<String> asStringList(Object value) {
    if (value instanceof List<?> list) {
      List<String> out = new ArrayList<>();
      for (Object o : list) {
        if (o != null) {
          String s = o.toString().trim();
          if (!s.isBlank()) out.add(s);
        }
      }
      return out;
    }
    return List.of();
  }

  private static String extractFirstJsonObject(String s) {
    if (s == null) return "";
    int start = s.indexOf('{');
    int end = s.lastIndexOf('}');
    if (start >= 0 && end > start) return s.substring(start, end + 1);
    return s.trim();
  }

  private static String safeMessage(Exception e) {
    String msg = e.getMessage();
    if (msg == null) return e.getClass().getSimpleName();
    return msg.length() > 180 ? msg.substring(0, 180) : msg;
  }
}