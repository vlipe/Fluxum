const express = require('express');
const router = express.Router();
// Importa o nosso controlador unificado
const ctrl = require('../controllers/telemetry.controller');

// Rota que já existia
router.post('/telemetry/batch', ctrl.ingestBatch);

// --- NOSSA NOVA ROTA, AGORA MAIS LIMPA ---
// A URL final será: POST /api/v1/telemetry/iot-data
router.post('/telemetry/iot-data', ctrl.receiveIoTPacket);

module.exports = router;