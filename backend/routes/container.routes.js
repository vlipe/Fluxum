const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/container.controller');

router.post('/containers', authRequired, ctrl.create);
router.get('/containers', authRequired, ctrl.list);
router.get('/containers/:id', authRequired, ctrl.getById);
router.put('/containers/:id', authRequired, ctrl.update);
router.delete('/containers/:id', authRequired, ctrl.remove);


module.exports = router;
