
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/containerEvents.controller');


router.post('/container-events', ctrl.createEvent);


router.get('/container-events', ctrl.listEvents);

module.exports = router;