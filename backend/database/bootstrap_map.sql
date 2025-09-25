CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS container_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  speed_kn DOUBLE PRECISION,
  heading_deg DOUBLE PRECISION,
  voyage_code TEXT,
  imo TEXT,
  ts_iso TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_container_positions_ts ON container_positions (ts_iso DESC);

INSERT INTO container_positions (container_id, lat, lon, speed_kn, heading_deg, voyage_code, imo, ts_iso) VALUES
('CONT-123', -23.96, -46.32, 12.5, 80, 'VOY-001', '9321483', NOW() - INTERVAL '2 hour'),
('CONT-123', -23.80, -43.20, 13.2, 75, 'VOY-001', '9321483', NOW() - INTERVAL '1 hour'),
('CONT-123', -22.90, -42.00, 14.1, 70, 'VOY-001', '9321483', NOW() - INTERVAL '20 minutes'),
('CONT-456', -34.90, -56.20, 10.2, 10, 'VOY-002', '9587452', NOW() - INTERVAL '50 minutes'),
('CONT-789', -12.97, -38.51, 9.8, 45, 'VOY-003', '9102468', NOW() - INTERVAL '15 minutes');
