const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/telemetry.controller');

router.post('/telemetry/batch', ctrl.ingestBatch);

module.exports = router;
