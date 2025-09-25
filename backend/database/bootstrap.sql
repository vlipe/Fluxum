CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  alert_type TEXT NOT NULL,
  container_id TEXT,
  message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS containers (
  id SERIAL PRIMARY KEY,
  container_id TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS device_status (
  id SERIAL PRIMARY KEY,
  battery_percent INT CHECK (battery_percent BETWEEN 0 AND 100),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO containers (container_id)
VALUES ('C01'), ('C02'), ('C03')
ON CONFLICT (container_id) DO NOTHING;

INSERT INTO device_status (battery_percent)
VALUES (73);

INSERT INTO alerts (id, alert_type, container_id, message, created_at)
VALUES
  ('1','TEMP_HIGH','C01','Temperatura elevada', NOW()),
  ('2','BAT_LOW','C02','Bateria baixa', NOW() - INTERVAL '1 hour'),
  ('3','ROUTE_DEVIATION','C03','Rota desviada', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
