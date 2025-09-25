const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/container.controller');

router.post('/containers', ctrl.create);

module.exports = router;
