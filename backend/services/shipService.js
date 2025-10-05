// backend/services/shipService.js
const { pool } = require('../database/db');
const { logger } = require('../utils/observability');

const createShip = async (shipData) => {
  const { name, imo, flag } = shipData;
  try {
    const query = `
      INSERT INTO ships (name, imo, flag) 
      VALUES ($1, $2, $3) 
      RETURNING *`; // RETURNING * nos devolve o navio que foi criado
    const values = [name, imo, flag];
    const { rows } = await pool.query(query, values);
    logger.info({ ship: rows[0] }, "Novo navio cadastrado com sucesso.");
    return rows[0];
  } catch (error) {
    logger.error({ err: error }, "Erro ao cadastrar novo navio.");
    throw error;
  }
};

const getAllShips = async () => {
  try {
    const { rows } = await pool.query('SELECT * FROM ships ORDER BY name ASC');
    return rows;
  } catch (error) {
    logger.error({ err: error }, "Erro ao buscar lista de navios.");
    throw error;
  }
};

module.exports = {
  createShip,
  getAllShips,
};