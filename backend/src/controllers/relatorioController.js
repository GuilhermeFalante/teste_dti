const relatorioService = require('../services/relatorioService');

async function relatorio(req, res, next) {
  try {
    res.json(await relatorioService.gerarRelatorio());
  } catch (erro) {
    next(erro);
  }
}

module.exports = { relatorio };
