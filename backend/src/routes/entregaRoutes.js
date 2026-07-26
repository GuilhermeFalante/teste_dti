const { Router } = require('express');
const entregaController = require('../controllers/entregaController');

const router = Router();

router.post('/alocar', entregaController.alocar);
router.get('/rota', entregaController.rota);
router.get('/fila', entregaController.fila);

module.exports = router;
