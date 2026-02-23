package com.sophie.aac.dialogue.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;

@Service
public class UserProfileService {

    private final ObjectMapper mapper = new ObjectMapper();

    public UserProfile loadProfileOrDefault() {
        try {
            var res = new ClassPathResource("user_profile.json");
            try (InputStream in = res.getInputStream()) {
                Map<String, Object> root = mapper.readValue(in, new TypeReference<>() {});
                return UserProfile.from(root);
            }
        } catch (Exception e) {
            return UserProfile.defaultProfile();
        }
    }

    public record UserProfile(
            String yesPrefix,
            String noText,
            String repeatText,
            List<String> likedFoods,
            List<String> dislikedFoods,
            List<String> likedDrinks,
            List<String> dislikedDrinks
    ) {
        static UserProfile defaultProfile() {
            return new UserProfile(
                    "Yes, please. I would like ",
                    "No, thank you.",
                    "Could you say that again, please?",
                    List.of("sandwich", "fruit"),
                    List.of(),
                    List.of("water", "tea"),
                    List.of()
            );
        }

        @SuppressWarnings("unchecked")
        static UserProfile from(Map<String, Object> root) {
            Map<String, Object> phrasing = asMap(root.get("preferredPhrasing"));
            Map<String, Object> likes = asMap(root.get("likes"));
            Map<String, Object> dislikes = asMap(root.get("dislikes"));

            return new UserProfile(
                    asString(phrasing.get("yesPrefix"), "Yes, please. I would like "),
                    asString(phrasing.get("noText"), "No, thank you."),
                    asString(phrasing.get("repeatText"), "Could you say that again, please?"),
                    asStringList(likes.get("foods")),
                    asStringList(dislikes.get("foods")),
                    asStringList(likes.get("drinks")),
                    asStringList(dislikes.get("drinks"))
            );
        }

        private static String asString(Object v, String fallback) {
            String s = v == null ? "" : v.toString().trim();
            return s.isBlank() ? fallback : s;
        }

        private static Map<String, Object> asMap(Object v) {
            if (v instanceof Map<?, ?> m) {
                Map<String, Object> out = new LinkedHashMap<>();
                for (var e : m.entrySet()) {
                    if (e.getKey() != null) out.put(e.getKey().toString(), e.getValue());
                }
                return out;
            }
            return Map.of();
        }

        private static List<String> asStringList(Object v) {
            if (v instanceof List<?> list) {
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
    }
}