const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/devices.controller');

router.post('/devices', ctrl.create);
router.post('/containers/:id/devices/attach', ctrl.attachToContainer);

module.exports = router;
