// backend/services/iotMonitoringService.js
const { logger } = require('../utils/observability');
const { pool } = require('../database/db');

const processTelemetry = async (data) => {
    logger.info({ telemetryData: data }, " Pacote de telemetria recebido.");

    const { deviceId, timestamp, temperatura, umidade, pressao_hpa, latitude, longitude, rfid_tag, gps_error, ambiente_error } = data;

    try {
        // ETAPA 1: Encontrar o ID do container associado ao deviceId
        logger.debug({ deviceId }, "Iniciando busca por container...");
        const containerResult = await pool.query(
            'SELECT id FROM containers WHERE iot_device_id = $1',
            [deviceId]
        );

        if (containerResult.rows.length === 0) {
            logger.warn({ deviceId }, "AVISO: Dispositivo IoT não associado. Nenhum dado foi salvo.");
            return; 
        }
        
        const containerId = containerResult.rows[0].id;
        logger.debug({ containerId }, `Container encontrado: ${containerId}`);

        // ETAPA 2: Inserir os dados na tabela de movimentos
        const event_type = rfid_tag ? 'RFID_DETECTED' : 'HEARTBEAT';
        
        // CORREÇÃO: Adicionado o placeholder $10
        const query = `
            INSERT INTO container_movements 
            (device_id, ts_iso, temp_c, humidity, pressure_hpa, lat, lng, tag, event_type, source, container_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'iot-device', $10) 
        `;
        
        // CORREÇÃO: A ordem dos valores agora corresponde à ordem das colunas
        const values = [
            deviceId,
            timestamp || new Date().toISOString(),
            ambiente_error ? null : temperatura,
            ambiente_error ? null : umidade,
            ambiente_error ? null : pressao_hpa,
            gps_error ? null : latitude,
            gps_error ? null : longitude,
            rfid_tag || null,
            event_type,
            containerId // O valor para o placeholder $10
        ];

        logger.debug("Executando query de inserção...");
        await pool.query(query, values);
        
        logger.info({ deviceId, containerId }, "Dados de telemetria salvos no banco de dados com sucesso!");

    } catch (dbError) {
        logger.error({ err: dbError, deviceId }, "ERRO CRÍTICO durante a operação com o banco de dados.");
        throw dbError; 
    }
};

module.exports = { processTelemetry };