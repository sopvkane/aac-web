ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS family_notes varchar(280),
  ADD COLUMN IF NOT EXISTS classmates varchar(280),
  ADD COLUMN IF NOT EXISTS teachers varchar(280),
  ADD COLUMN IF NOT EXISTS school_activities varchar(280);

