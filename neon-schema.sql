CREATE TABLE IF NOT EXISTS wedding_wishes (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(40) NOT NULL CHECK (char_length(name) BETWEEN 2 AND 40),
  message VARCHAR(280) NOT NULL CHECK (char_length(message) BETWEEN 2 AND 280),
  approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wedding_wishes_created_at_idx
  ON wedding_wishes (created_at DESC);
