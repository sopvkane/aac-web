package com.sophie.aac.dialogue.web;

import java.util.List;
import java.util.Map;

public record DialogueRequest(
        String userName,
        String questionText,
        Map<String, String> context,
        ConversationMemory memory
) {
    public record ConversationMemory(
            String lastIntent,
            String lastQuestionText,
            List<OptionGroup> lastOptionGroups
    ) {}

    public record OptionGroup(
            String id,
            String title,
            List<String> items
    ) {}
}