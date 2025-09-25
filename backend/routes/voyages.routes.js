const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/voyages.controller');

router.post('/voyages', ctrl.create);
router.post('/voyages/:id/start', ctrl.start);
router.post('/voyages/:id/arrive', ctrl.arrive);
router.post('/voyages/:id/complete', ctrl.complete);
router.get('/voyages/:id/last-update', ctrl.lastUpdate);
router.post('/voyages/:id/containers', ctrl.addContainers);
router.get('/voyages/:id/containers', ctrl.listContainers);
router.get('/voyages/:id/trail', ctrl.trail);

module.exports = router;
