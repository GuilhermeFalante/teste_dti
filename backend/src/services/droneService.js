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

// Transições do drone que também mudam o status dos pedidos da viagem ativa dele:
// carregando -> em_voo (pedidos saem para entrega) e em_voo -> entregando (pedidos entregues).
const STATUS_PEDIDO_POR_TRANSICAO = {
  'carregando->em_voo': 'em_rota',
  'em_voo->entregando': 'entregue',
};

async function avancarEstadoDrone(id, novoEstado) {
  const drone = await droneRepository.buscarPorId(id);
  if (!drone) {
    throw new ErroDominio('Drone não encontrado.', 404);
  }

  const estadoAnterior = drone.estado;
  const estadoValidado = transicionar(estadoAnterior, novoEstado);
  const droneAtualizado = await droneRepository.atualizarEstado(id, estadoValidado);

  const transicao = `${estadoAnterior}->${estadoValidado}`;
  const novoStatusPedido = STATUS_PEDIDO_POR_TRANSICAO[transicao];
  if (novoStatusPedido) {
    await atualizarPedidosDaViagemAtiva(id, novoStatusPedido);
  } else if (transicao === 'entregando->retornando') {
    const viagemAtiva = await viagemRepository.buscarViagemAtivaPorDrone(id);
    if (viagemAtiva) await viagemRepository.finalizar(viagemAtiva.id);
  }

  return droneAtualizado;
}

async function atualizarPedidosDaViagemAtiva(droneId, status) {
  const viagemAtiva = await viagemRepository.buscarViagemAtivaPorDrone(droneId);
  if (!viagemAtiva) return;

  const itens = await viagemRepository.buscarPedidosDaViagem(viagemAtiva.id);
  await Promise.all(itens.map((item) => pedidoRepository.atualizarStatus(item.pedidoId, status)));
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
