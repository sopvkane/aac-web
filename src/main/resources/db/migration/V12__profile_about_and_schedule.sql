ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS about_user varchar(500),
  ADD COLUMN IF NOT EXISTS school_days varchar(32),       -- e.g. "MON-FRI"
  ADD COLUMN IF NOT EXISTS lunch_time varchar(8),         -- "12:15"
  ADD COLUMN IF NOT EXISTS dinner_time varchar(8),        -- "18:00"
  ADD COLUMN IF NOT EXISTS bed_time varchar(8);           -- "21:00"

