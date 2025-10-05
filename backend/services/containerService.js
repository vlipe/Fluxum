// backend/services/containerService.js
const { pool } = require('../database/db');
const { logger } = require('../utils/observability');

/**
 * Cria um novo container no banco de dados, associado a um navio.
 */
const createContainer = async (containerData) => {
  // Note que agora recebemos o ship_id
  const { id, owner, description, min_temp, max_temp, rfid_tag_id, iot_device_id, ship_id } = containerData;

  // Validação básica
  if (!id || !ship_id) {
    throw new Error("ID do container e ID do navio são obrigatórios.");
  }

  try {
    const query = `
      INSERT INTO containers (id, owner, description, min_temp, max_temp, rfid_tag_id, iot_device_id, current_ship_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [id, owner, description, min_temp, max_temp, rfid_tag_id, iot_device_id, ship_id];
    const { rows } = await pool.query(query, values);
    
    logger.info({ container: rows[0] }, "Novo container cadastrado com sucesso.");
    return rows[0];
  } catch (error) {
    logger.error({ err: error, containerData }, "Erro ao cadastrar novo container.");
    throw error;
  }
};

/**
 * Lista todos os containers.
 */
const getAllContainers = async () => {
  try {
    const { rows } = await pool.query('SELECT * FROM containers ORDER BY created_at DESC');
    return rows;
  } catch (error) {
    logger.error({ err: error }, "Erro ao buscar lista de containers.");
    throw error;
  }
};

module.exports = {
  createContainer,
  getAllContainers,
};