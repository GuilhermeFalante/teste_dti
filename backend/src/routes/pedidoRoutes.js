const { Router } = require('express');
const pedidoController = require('../controllers/pedidoController');

const router = Router();

router.post('/', pedidoController.criar);
router.get('/', pedidoController.listar);

module.exports = router;
