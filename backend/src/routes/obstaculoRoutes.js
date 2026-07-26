const { Router } = require('express');
const obstaculoController = require('../controllers/obstaculoController');

const router = Router();

router.post('/', obstaculoController.criar);
router.get('/', obstaculoController.listar);
router.put('/:id', obstaculoController.atualizar);
router.delete('/:id', obstaculoController.remover);

module.exports = router;
