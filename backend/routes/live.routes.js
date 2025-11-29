const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const live = require('../controllers/live.controller');

router.get('/live/ships', authRequired, live.ships);
router.get('/live/containers', authRequired, live.containers); // <-- NOVA

module.exports = router;
