const { Router } = require('express');
const relatorioController = require('../controllers/relatorioController');

const router = Router();

router.get('/', relatorioController.relatorio);

module.exports = router;
