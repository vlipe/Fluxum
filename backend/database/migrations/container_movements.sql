CREATE TABLE IF NOT EXISTS container_movements (
  id           SERIAL PRIMARY KEY,
  container_id TEXT    NOT NULL,
  event_type   TEXT    NOT NULL,
  site         TEXT,
  location     TEXT,
  gpio         INTEGER,
  device_id    TEXT,
  tag          TEXT,
  ts_iso       TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mov_container ON container_movements(container_id);
CREATE INDEX IF NOT EXISTS idx_mov_location  ON container_movements(location);
CREATE INDEX IF NOT EXISTS idx_mov_ts        ON container_movements(ts_iso);
