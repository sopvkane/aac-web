-- Seed a year of analytics + wellbeing data (including pain body areas).
-- This is used by the caregiver dashboard range selector + heatmap.
-- Runs once via Flyway; guarded to avoid duplicating in an existing DB.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM wellbeing_entry WHERE notes LIKE 'SEED_PAST_YEAR%') THEN
    RETURN;
  END IF;

  -- Interactions: a simple, consistent cadence across the last year.
  INSERT INTO interaction_event (id, event_type, location, prompt_type, selected_text, created_at)
  SELECT
    gen_random_uuid(),
    CASE WHEN (n % 3) = 0 THEN 'OPTION_SELECTED' ELSE 'SUGGESTIONS_SERVED' END,
    CASE
      WHEN (n % 5) = 0 THEN 'SCHOOL'
      WHEN (n % 7) = 0 THEN 'OTHER'
      ELSE 'HOME'
    END,
    CASE
      WHEN (n % 4) = 0 THEN 'FOOD'
      WHEN (n % 4) = 1 THEN 'DRINK'
      WHEN (n % 4) = 2 THEN 'ACTIVITY'
      ELSE 'GENERAL'
    END,
    CASE
      WHEN (n % 4) = 0 THEN 'SEED_PAST_YEAR: I want food'
      WHEN (n % 4) = 1 THEN 'SEED_PAST_YEAR: I want a drink'
      WHEN (n % 4) = 2 THEN 'SEED_PAST_YEAR: I want to do something'
      ELSE NULL
    END,
    (now() - (n || ' days')::interval)
      - CASE WHEN (n % 2) = 0 THEN interval '3 hours' ELSE interval '9 hours' END
  FROM generate_series(0, 364) AS n;

  -- Mood check-ins: every 3rd day, using the API-valid range 1..5.
  INSERT INTO wellbeing_entry (id, mood_score, symptom_type, body_area, severity, notes, created_at)
  SELECT
    gen_random_uuid(),
    (1 + (n % 5))::int,
    NULL,
    NULL,
    NULL,
    'SEED_PAST_YEAR mood',
    (now() - (n || ' days')::interval) - interval '6 hours'
  FROM generate_series(0, 364) AS n
  WHERE (n % 3) = 0;

  -- Pain taps: 1-2 times per month on average, spread across body areas we show on the heatmap.
  INSERT INTO wellbeing_entry (id, mood_score, symptom_type, body_area, severity, notes, created_at)
  SELECT
    gen_random_uuid(),
    NULL,
    'PAIN',
    CASE (n % 12)
      WHEN 0 THEN 'HEAD'
      WHEN 1 THEN 'TUMMY'
      WHEN 2 THEN 'LEFT_ARM'
      WHEN 3 THEN 'RIGHT_ARM'
      WHEN 4 THEN 'LEFT_ELBOW'
      WHEN 5 THEN 'RIGHT_ELBOW'
      WHEN 6 THEN 'LEFT_HAND'
      WHEN 7 THEN 'RIGHT_HAND'
      WHEN 8 THEN 'LEFT_KNEE'
      WHEN 9 THEN 'RIGHT_KNEE'
      WHEN 10 THEN 'LEFT_LEG'
      ELSE 'RIGHT_LEG'
    END,
    (2 + (n % 8))::int,
    'SEED_PAST_YEAR pain',
    (now() - (n || ' days')::interval) - interval '1 hour'
  FROM generate_series(0, 364) AS n
  WHERE (n % 29) = 0 OR (n % 31) = 0;
END $$;

