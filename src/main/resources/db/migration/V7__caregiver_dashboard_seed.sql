-- Seed some sample analytics data for the caregiver dashboard

-- Make sure the default profile has some favourites set
UPDATE user_profile
SET
  fav_food = COALESCE(fav_food, 'Banana'),
  fav_drink = COALESCE(fav_drink, 'Apple juice'),
  fav_show = COALESCE(fav_show, 'Bluey'),
  fav_topic = COALESCE(fav_topic, 'Animals')
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Insert example interaction events over the last few days
INSERT INTO interaction_event (id, event_type, location, prompt_type, selected_text, created_at)
VALUES
  (gen_random_uuid(), 'OPTION_SELECTED', 'HOME', 'FOOD', 'I want a banana', now() - interval '6 hours'),
  (gen_random_uuid(), 'OPTION_SELECTED', 'HOME', 'DRINK', 'I want apple juice', now() - interval '3 hours'),
  (gen_random_uuid(), 'OPTION_SELECTED', 'SCHOOL', 'SHOW', 'I want to watch Bluey', now() - interval '1 day'),
  (gen_random_uuid(), 'OPTION_SELECTED', 'HOME', 'TOPIC', 'I want to talk about animals', now() - interval '2 days'),
  (gen_random_uuid(), 'SUGGESTIONS_SERVED', 'HOME', 'GENERAL', null, now() - interval '30 minutes');

-- Insert example wellbeing entries, including some pain events
INSERT INTO wellbeing_entry (id, mood_score, symptom_type, body_area, severity, notes, created_at)
VALUES
  (gen_random_uuid(), 7, null, null, null, 'Happy after watching favourite show', now() - interval '5 hours'),
  (gen_random_uuid(), 5, 'PAIN', 'stomach', 3, 'Mild tummy ache before lunch', now() - interval '1 day'),
  (gen_random_uuid(), 4, 'PAIN', 'head', 6, 'Headache after school', now() - interval '2 days'),
  (gen_random_uuid(), 8, null, null, null, 'Good mood at breakfast', now() - interval '3 days');

