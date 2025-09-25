// backend/routes/stats.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stats.controller');

router.get('/containers/stats/per-day', ctrl.movementsPerDay);
router.get('/containers/stats/by-location', ctrl.byLocation);
router.get('/containers/stats/top-containers', ctrl.topContainers);
router.get('/containers/with-voyage', ctrl.listWithVoyage);

module.exports = router;
