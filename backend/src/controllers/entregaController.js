const entregaService = require('../services/entregaService');

async function alocar(req, res, next) {
  try {
    res.status(201).json(await entregaService.processarAlocacoes());
  } catch (erro) {
    next(erro);
  }
}

async function rota(req, res, next) {
  try {
    res.json(await entregaService.listarRotas());
  } catch (erro) {
    next(erro);
  }
}

async function fila(req, res, next) {
  try {
    res.json(await entregaService.listarFilaDeEntrega());
  } catch (erro) {
    next(erro);
  }
}

module.exports = { alocar, rota, fila };
