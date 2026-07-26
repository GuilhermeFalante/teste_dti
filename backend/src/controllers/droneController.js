const droneService = require('../services/droneService');

async function criar(req, res, next) {
  try {
    const { nome, capacidadeKg, alcanceKm } = req.body;
    const drone = await droneService.registrarDrone({ nome, capacidadeKg, alcanceKm });
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

module.exports = { criar, listarStatus, avancarEstado };
