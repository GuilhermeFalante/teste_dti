const obstaculoService = require('../services/obstaculoService');

async function criar(req, res, next) {
  try {
    const { nome, centroX, centroY, raioKm } = req.body;
    const obstaculo = await obstaculoService.registrarObstaculo({ nome, centroX, centroY, raioKm });
    res.status(201).json(obstaculo);
  } catch (erro) {
    next(erro);
  }
}

async function listar(req, res, next) {
  try {
    res.json(await obstaculoService.listarObstaculos());
  } catch (erro) {
    next(erro);
  }
}

module.exports = { criar, listar };
