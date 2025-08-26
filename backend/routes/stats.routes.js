const express = require('express');
const router = express.Router();
const stats = require('../controllers/stats.controller');

router.get('/stats/movements-per-day', stats.movementsPerDay);
router.get('/stats/by-location',       stats.byLocation);
router.get('/stats/top-containers',    stats.topContainers);

module.exports = router;
