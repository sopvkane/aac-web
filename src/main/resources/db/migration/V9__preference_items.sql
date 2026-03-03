CREATE TABLE IF NOT EXISTS preference_item (
  id uuid PRIMARY KEY,
  kind varchar(40) NOT NULL,          -- FOOD / DRINK / ACTIVITY / FAMILY_MEMBER / ...
  label varchar(80) NOT NULL,
  category varchar(40),
  tags text,                          -- comma-separated or JSON-style tags
  image_url varchar(255),
  scope varchar(16) NOT NULL DEFAULT 'HOME', -- HOME / SCHOOL / BOTH
  priority int NOT NULL DEFAULT 0,
  created_by_role varchar(16),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pref_item_kind ON preference_item(kind);
CREATE INDEX IF NOT EXISTS idx_pref_item_scope ON preference_item(scope);

