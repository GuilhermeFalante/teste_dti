const { validarNovoObstaculo } = require('../domain/obstaculo');
const { ErroDominio } = require('../domain/erroDominio');
const { obstaculoRepository } = require('../repositories');

async function registrarObstaculo(dados) {
  const obstaculoValidado = validarNovoObstaculo(dados);
  return obstaculoRepository.criar(obstaculoValidado);
}

async function listarObstaculos() {
  return obstaculoRepository.listarTodos();
}

async function atualizarObstaculo(id, dados) {
  const obstaculo = await obstaculoRepository.buscarPorId(id);
  if (!obstaculo) {
    throw new ErroDominio('Obstáculo não encontrado.', 404);
  }

  const obstaculoValidado = validarNovoObstaculo(dados);
  return obstaculoRepository.atualizar(id, obstaculoValidado);
}

async function removerObstaculo(id) {
  const obstaculo = await obstaculoRepository.buscarPorId(id);
  if (!obstaculo) {
    throw new ErroDominio('Obstáculo não encontrado.', 404);
  }

  await obstaculoRepository.remover(id);
}

module.exports = { registrarObstaculo, listarObstaculos, atualizarObstaculo, removerObstaculo };
