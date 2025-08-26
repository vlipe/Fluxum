const express = require('express');
const router = express.Router();
const controller = require('../controllers/containerEvents.controller');

router.post('/register', controller.registerMovement);
router.get('/', controller.getAllMovements);

module.exports = router;
