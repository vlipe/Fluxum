// routes/ships.routes.js
const express = require('express');
const ctrl = require('../controllers/ships.controller');
const router = express.Router();

router.post('/ships', ctrl.create);
router.get('/ships', ctrl.list);
router.get('/ships/:ship_id', ctrl.getById);

module.exports = router;
