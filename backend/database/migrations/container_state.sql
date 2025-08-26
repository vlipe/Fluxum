CREATE TABLE IF NOT EXISTS container_state (
  container_id TEXT PRIMARY KEY,
  last_event_type TEXT NOT NULL,
  last_location   TEXT,
  last_site       TEXT,
  last_gpio       INTEGER,
  last_ts_iso     TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
