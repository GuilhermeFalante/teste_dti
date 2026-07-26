const { validarNovoObstaculo } = require('../domain/obstaculo');
const { obstaculoRepository } = require('../repositories');

async function registrarObstaculo(dados) {
  const obstaculoValidado = validarNovoObstaculo(dados);
  return obstaculoRepository.criar(obstaculoValidado);
}

async function listarObstaculos() {
  return obstaculoRepository.listarTodos();
}

module.exports = { registrarObstaculo, listarObstaculos };
