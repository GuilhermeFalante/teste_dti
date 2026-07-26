const droneService = require('../services/droneService');

async function criar(req, res, next) {
  try {
    const { nome, capacidadeKg, alcanceKm, velocidadeKmH } = req.body;
    const drone = await droneService.registrarDrone({ nome, capacidadeKg, alcanceKm, velocidadeKmH });
    res.status(201).json(drone);
  } catch (erro) {
    next(erro);
  }
}

async function listarStatus(req, res, next) {
  try {
    res.json(await droneService.listarStatusDrones());
  } catch (erro) {
    next(erro);
  }
}

async function avancarEstado(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const drone = await droneService.avancarEstadoDrone(id, estado);
    res.json(drone);
  } catch (erro) {
    next(erro);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, capacidadeKg, alcanceKm, velocidadeKmH } = req.body;
    const drone = await droneService.atualizarDrone(id, { nome, capacidadeKg, alcanceKm, velocidadeKmH });
    res.json(drone);
  } catch (erro) {
    next(erro);
  }
}

async function remover(req, res, next) {
  try {
    const { id } = req.params;
    await droneService.removerDrone(id);
    res.status(204).send();
  } catch (erro) {
    next(erro);
  }
}

module.exports = { criar, listarStatus, avancarEstado, atualizar, remover };
