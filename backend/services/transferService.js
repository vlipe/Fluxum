// backend/services/transferService.js
const { logger } = require('../utils/observability');
const { pool } = require('../database/db');

// Esta variável guardará o estado da transferência ativa na memória do servidor.
let activeTransfer = {
  isActive: false,
  fromShipId: null,
  toShipId: null,
  startedBy: null,
};

const startTransfer = ({ fromShipId, toShipId, userId }) => {
  if (activeTransfer.isActive) {
    throw new Error("Já existe uma transferência ativa. Finalize a anterior primeiro.");
  }
  activeTransfer = {
    isActive: true,
    fromShipId,
    toShipId,
    startedBy: userId,
    movedContainers: new Set(), // Para rastrear os containers já movidos
  };
  logger.info(activeTransfer, "Modo de Transferência INICIADO.");
  return activeTransfer;
};

const endTransfer = () => {
  if (!activeTransfer.isActive) {
    throw new Error("Nenhuma transferência ativa para finalizar.");
  }
  logger.info(activeTransfer, "Modo de Transferência FINALIZADO.");
  activeTransfer = { isActive: false, fromShipId: null, toShipId: null, startedBy: null };
  return activeTransfer;
};

const getActiveTransfer = () => {
  return activeTransfer;
};


const processRfidScan = async (rfidTag) => {
  const transfer = getActiveTransfer();
  if (!transfer.isActive) {
    logger.info({ rfidTag }, "Scan RFID recebido, mas nenhuma transferência está ativa. Ignorando.");
    return; // Não faz nada se o modo de transferência estiver desligado
  }
  
  if (transfer.movedContainers.has(rfidTag)) {
    logger.warn({ rfidTag }, "Este container já foi movido nesta transferência. Ignorando scan duplicado.");
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Encontra o container pelo ID da sua etiqueta RFID
    const containerResult = await client.query('SELECT id FROM containers WHERE rfid_tag_id = $1', [rfidTag]);
    if (containerResult.rows.length === 0) {
      logger.error({ rfidTag }, "Scan RFID recebido para uma etiqueta não cadastrada em nenhum container.");
      await client.query('ROLLBACK');
      return;
    }
    const containerId = containerResult.rows[0].id;
    
    // 2. A Mágica: Atualiza a 'viagem' do container para o novo navio
    // (Esta é uma query de exemplo, você pode adaptar para sua lógica de 'viagens')
    await client.query(
      `UPDATE voyage_containers SET voyage_id = (SELECT voyage_id FROM voyages WHERE ship_id = $1 ORDER BY departure_date DESC LIMIT 1)
       WHERE container_id = $2 AND voyage_id = (SELECT voyage_id FROM voyages WHERE ship_id = $3 ORDER BY departure_date DESC LIMIT 1)`,
      [transfer.toShipId, containerId, transfer.fromShipId]
    );
    
    // (Lógica alternativa mais simples: atualizar uma coluna 'current_ship_id' na tabela 'containers')
    // await client.query('UPDATE containers SET current_ship_id = $1 WHERE id = $2', [transfer.toShipId, containerId]);

    await client.query('COMMIT');
    transfer.movedContainers.add(rfidTag); // Marca o container como movido
    logger.info({ containerId, from: transfer.fromShipId, to: transfer.toShipId }, "CONTAINER TRANSFERIDO COM SUCESSO!");

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ err: error, rfidTag }, "Erro ao processar a transferência do container.");
  } finally {
    client.release();
  }
};

// Futuramente, adicionaremos a lógica de processar um scan aqui.

module.exports = {
  startTransfer,
  endTransfer,
  getActiveTransfer,
  processRfidScan,
};