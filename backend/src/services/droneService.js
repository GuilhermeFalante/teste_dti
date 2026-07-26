const { validarNovoDrone } = require('../domain/drone');
const { transicionar } = require('../domain/droneStateMachine');
const { ErroDominio } = require('../domain/erroDominio');
const { droneRepository } = require('../repositories');

async function registrarDrone(dados) {
  const droneValidado = validarNovoDrone(dados);
  return droneRepository.criar(droneValidado);
}

async function listarStatusDrones() {
  return droneRepository.listarTodos();
}

async function avancarEstadoDrone(id, novoEstado) {
  const drone = await droneRepository.buscarPorId(id);
  if (!drone) {
    throw new ErroDominio('Drone não encontrado.', 404);
  }

  const estadoValidado = transicionar(drone.estado, novoEstado);
  return droneRepository.atualizarEstado(id, estadoValidado);
}

module.exports = { registrarDrone, listarStatusDrones, avancarEstadoDrone };
