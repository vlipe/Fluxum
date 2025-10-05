ALTER TABLE container_movements
  ADD COLUMN IF NOT EXISTS battery_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS temp_c NUMERIC;

ALTER TABLE container_state
  ADD COLUMN IF NOT EXISTS last_battery_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS last_temp_c NUMERIC;

CREATE INDEX IF NOT EXISTS idx_mov_battery_ts ON container_movements((COALESCE(ts_iso, created_at)) DESC) WHERE battery_percent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mov_temp_ts    ON container_movements((COALESCE(ts_iso, created_at)) DESC) WHERE temp_c IS NOT NULL;

CREATE OR REPLACE FUNCTION fn_upsert_container_state()
RETURNS trigger AS $$
BEGIN
  INSERT INTO container_state (
    container_id, last_event_type, last_location, last_site, last_gpio, last_ts_iso,
    last_lat, last_lng, last_tag, last_device_id, last_battery_percent, last_temp_c, updated_at
  ) VALUES (
    NEW.container_id, NEW.event_type, NEW.location, NEW.site, NEW.gpio,
    COALESCE(NEW.ts_iso, NEW.created_at),
    NEW.lat, NEW.lng, NEW.tag, NEW.device_id, NEW.battery_percent, NEW.temp_c, now()
  )
  ON CONFLICT (container_id) DO UPDATE SET
    last_event_type       = EXCLUDED.last_event_type,
    last_location         = EXCLUDED.last_location,
    last_site             = EXCLUDED.last_site,
    last_gpio             = EXCLUDED.last_gpio,
    last_ts_iso           = EXCLUDED.last_ts_iso,
    last_lat              = EXCLUDED.last_lat,
    last_lng              = EXCLUDED.last_lng,
    last_tag              = EXCLUDED.last_tag,
    last_device_id        = EXCLUDED.last_device_id,
    last_battery_percent  = EXCLUDED.last_battery_percent,
    last_temp_c           = EXCLUDED.last_temp_c,
    updated_at            = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
