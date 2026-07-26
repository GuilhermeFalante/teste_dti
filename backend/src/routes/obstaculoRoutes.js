const { Router } = require('express');
const obstaculoController = require('../controllers/obstaculoController');

const router = Router();

router.post('/', obstaculoController.criar);
router.get('/', obstaculoController.listar);

module.exports = router;
