const { validarNovoDrone } = require('../domain/drone');
const { transicionar } = require('../domain/droneStateMachine');
const { ErroDominio } = require('../domain/erroDominio');
const { droneRepository, viagemRepository, pedidoRepository } = require('../repositories');

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

async function atualizarDrone(id, dados) {
  const drone = await droneRepository.buscarPorId(id);
  if (!drone) {
    throw new ErroDominio('Drone não encontrado.', 404);
  }

  const droneValidado = validarNovoDrone(dados);
  return droneRepository.atualizar(id, droneValidado);
}

// Remove o drone e, em cascata (via FK no banco), as viagens dele e os itens de
// viagem_pedidos associados. Antes disso, devolve para "pendente" os pedidos dessas
// viagens, para que fiquem disponíveis para realocação em outro drone.
async function removerDrone(id) {
  const drone = await droneRepository.buscarPorId(id);
  if (!drone) {
    throw new ErroDominio('Drone não encontrado.', 404);
  }

  const viagens = await viagemRepository.listarPorDrone(id);
  const pedidoIds = new Set();
  for (const viagem of viagens) {
    const itens = await viagemRepository.buscarPedidosDaViagem(viagem.id);
    itens.forEach((item) => pedidoIds.add(item.pedidoId));
  }

  await Promise.all([...pedidoIds].map((pedidoId) => pedidoRepository.atualizarStatus(pedidoId, 'pendente')));
  await droneRepository.remover(id);
}

module.exports = { registrarDrone, listarStatusDrones, avancarEstadoDrone, atualizarDrone, removerDrone };
