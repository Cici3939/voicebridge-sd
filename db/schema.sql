-- Run in Neon SQL Editor
-- VoiceBridge SD — Neon Postgres

CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('food','shelter','clinic')),
  address TEXT,
  area TEXT, -- e.g. 'La Jolla', 'Downtown', 'San Diego'
  phone TEXT,
  hours TEXT,
  website TEXT,
  description TEXT,
  source_url TEXT,
  last_scraped TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_area ON resources(area);

-- Lets seed + scrape upsert without duplicates:
-- ON CONFLICT (name, source_url) DO UPDATE ... needs this unique index.
CREATE UNIQUE INDEX IF NOT EXISTS idx_resources_name_source ON resources(name, source_url);

-- Example query the Gemini backend uses:
-- SELECT * FROM resources WHERE type = 'food' AND area ILIKE '%La Jolla%' ORDER BY last_scraped DESC LIMIT 3;
