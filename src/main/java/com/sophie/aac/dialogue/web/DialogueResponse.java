package com.sophie.aac.dialogue.web;

import java.util.List;
import java.util.Map;

public record DialogueResponse(
        String intent,
        List<Reply> topReplies,
        List<OptionGroup> optionGroups,
        Memory memory,
        Map<String, Object> debug
) {
    public record Reply(String id, String label, String text) {}

    public record OptionGroup(String id, String title, List<String> items) {}

    public record Memory(
            String lastIntent,
            String lastQuestionText,
            List<OptionGroup> lastOptionGroups
    ) {}
}