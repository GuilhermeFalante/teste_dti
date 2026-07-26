const { Router } = require('express');
const droneController = require('../controllers/droneController');

const router = Router();

router.post('/', droneController.criar);
router.get('/status', droneController.listarStatus);
router.patch('/:id/estado', droneController.avancarEstado);
router.put('/:id', droneController.atualizar);
router.delete('/:id', droneController.remover);

module.exports = router;
