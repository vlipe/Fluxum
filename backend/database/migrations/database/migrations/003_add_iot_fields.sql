-- PASSO 1: Adicionar colunas para os dados do sensor ambiental na tabela de eventos.
ALTER TABLE container_movements
  ADD COLUMN IF NOT EXISTS humidity NUMERIC,
  ADD COLUMN IF NOT EXISTS pressure_hpa NUMERIC;

-- PASSO 2: Aprimorar a tabela de 'containers' para guardar as configurações da IoT.
ALTER TABLE containers
  ADD COLUMN IF NOT EXISTS iot_device_id TEXT UNIQUE, -- O ID do dispositivo IoT associado.
  ADD COLUMN IF NOT EXISTS min_temp NUMERIC,      -- A temperatura mínima configurada.
  ADD COLUMN IF NOT EXISTS max_temp NUMERIC;      -- A temperatura máxima configurada.

-- PASSO 3: Adicionar um índice para otimizar a busca pelo iot_device_id.
CREATE INDEX IF NOT EXISTS idx_containers_iot_device_id ON containers(iot_device_id);

-- Confirma todas as alterações no banco de dados.
COMMIT;