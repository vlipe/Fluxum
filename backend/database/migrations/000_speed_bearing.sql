-- graus ↔ radianos
CREATE OR REPLACE FUNCTION deg2rad(d double precision)
RETURNS double precision LANGUAGE sql IMMUTABLE STRICT AS $$ SELECT d * pi() / 180.0 $$;

CREATE OR REPLACE FUNCTION rad2deg(r double precision)
RETURNS double precision LANGUAGE sql IMMUTABLE STRICT AS $$ SELECT r * 180.0 / pi() $$;

-- distância Haversine (metros)
CREATE OR REPLACE FUNCTION haversine_m(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
RETURNS double precision LANGUAGE sql IMMUTABLE STRICT AS $$
  WITH c AS (
    SELECT
      deg2rad(lat2 - lat1) AS dlat,
      deg2rad(lon2 - lon1) AS dlon,
      deg2rad(lat1) AS rlat1,
      deg2rad(lat2) AS rlat2
  )
  SELECT 2 * 6371008.8 * asin(sqrt( sin(dlat/2)^2 + cos(rlat1) * cos(rlat2) * sin(dlon/2)^2 ));
$$;

-- rumo (bearing) graus 0..360 do ponto (lat1,lon1) para (lat2,lon2)
CREATE OR REPLACE FUNCTION bearing_deg(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
RETURNS double precision LANGUAGE sql IMMUTABLE STRICT AS $$
  WITH c AS (
    SELECT
      deg2rad(lat1) AS rlat1,
      deg2rad(lon1) AS rlon1,
      deg2rad(lat2) AS rlat2,
      deg2rad(lon2) AS rlon2
  ), d AS (
    SELECT
      atan2(
        sin(rlon2-rlon1) * cos(rlat2),
        cos(rlat1)*sin(rlat2) - sin(rlat1)*cos(rlat2)*cos(rlon2-rlon1)
      ) AS brad
    FROM c
  )
  SELECT (rad2deg(brad) + 360.0) % 360.0 FROM d;
$$;




CREATE OR REPLACE VIEW container_positions AS
WITH latest AS (
  SELECT DISTINCT ON (cm.container_id)
    cm.container_id,
    cm.lat,
    cm.lng AS lon,
    cm.speed_kn,
    cm.heading_deg,
    cm.voyage_code,
    cm.imo,
    COALESCE(cm.ts_iso, cm.created_at) AS ts_iso
  FROM container_movements cm
  WHERE cm.lat IS NOT NULL AND cm.lng IS NOT NULL
  ORDER BY cm.container_id, COALESCE(cm.ts_iso, cm.created_at) DESC
),
prev AS (
  SELECT
    l.container_id,
    l.lat, l.lon, l.speed_kn, l.heading_deg, l.voyage_code, l.imo, l.ts_iso,
    -- ponto anterior
    (
      SELECT COALESCE(ts_iso, created_at) FROM container_movements cm2
      WHERE cm2.container_id = l.container_id
        AND cm2.lat IS NOT NULL AND cm2.lng IS NOT NULL
        AND COALESCE(cm2.ts_iso, cm2.created_at) < l.ts_iso
      ORDER BY COALESCE(cm2.ts_iso, cm2.created_at) DESC
      LIMIT 1
    ) AS prev_ts,
    (
      SELECT lat FROM container_movements cm2
      WHERE cm2.container_id = l.container_id
        AND cm2.lat IS NOT NULL AND cm2.lng IS NOT NULL
        AND COALESCE(cm2.ts_iso, cm2.created_at) < l.ts_iso
      ORDER BY COALESCE(cm2.ts_iso, cm2.created_at) DESC
      LIMIT 1
    ) AS prev_lat,
    (
      SELECT lng FROM container_movements cm2
      WHERE cm2.container_id = l.container_id
        AND cm2.lat IS NOT NULL AND cm2.lng IS NOT NULL
        AND COALESCE(cm2.ts_iso, cm2.created_at) < l.ts_iso
      ORDER BY COALESCE(cm2.ts_iso, cm2.created_at) DESC
      LIMIT 1
    ) AS prev_lon
  FROM latest l
)
SELECT
  container_id,
  lat,
  lon,
  COALESCE(
    speed_kn,
    CASE
      WHEN prev_ts IS NULL OR prev_lat IS NULL OR prev_lon IS NULL THEN NULL
      ELSE (haversine_m(prev_lat, prev_lon, lat, lon) / NULLIF(EXTRACT(EPOCH FROM (ts_iso - prev_ts)),0)) * 1.94384
    END
  )::numeric(10,3) AS speed_kn,
  COALESCE(
    heading_deg,
    CASE
      WHEN prev_ts IS NULL OR prev_lat IS NULL OR prev_lon IS NULL THEN NULL
      ELSE bearing_deg(prev_lat, prev_lon, lat, lon)
    END
  )::numeric(10,3) AS heading_deg,
  voyage_code,
  imo,
  ts_iso
FROM prev; 





DROP VIEW IF EXISTS latest_container_positions;
CREATE VIEW latest_container_positions AS
SELECT
  row_number() OVER ()::int AS id,
  container_id,
  voyage_code,
  imo,
  lat,
  lon,
  speed_kn,
  ts_iso
FROM container_positions;

-- === Views para “foco no navio” e contagem a bordo ===
CREATE OR REPLACE VIEW voyage_container_counts AS
SELECT voyage_code, COUNT(*)::int AS containers_onboard
FROM container_positions
WHERE voyage_code IS NOT NULL
GROUP BY voyage_code;

CREATE OR REPLACE VIEW ship_positions AS
SELECT
  cp.voyage_code,
  AVG(cp.lat)  AS lat,
  AVG(cp.lon)  AS lon,
  MAX(cp.ts_iso) AS ts_iso,
  COALESCE(vcc.containers_onboard,0) AS containers_onboard
FROM container_positions cp
LEFT JOIN voyage_container_counts vcc USING (voyage_code)
WHERE cp.voyage_code IS NOT NULL
GROUP BY cp.voyage_code, vcc.containers_onboard;
