const { alocarPedidos, validarDespachoManual } = require('../domain/alocacaoService');
const { transicionar } = require('../domain/droneStateMachine');
const { consumirBateria } = require('../domain/drone');
const { ordenarFilaDeEntrega } = require('../domain/filaDeEntrega');
const { ErroDominio } = require('../domain/erroDominio');
const { droneRepository, pedidoRepository, viagemRepository, obstaculoRepository } = require('../repositories');
const { agendarProgressoAutomatico } = require('./simulacaoVooService');

// Orquestra o passo principal do desafio: pega pedidos pendentes + drones livres,
// roda a heurística de alocação (domínio puro, já considerando bateria e obstáculos) e
// persiste o resultado, incluindo o consumo de bateria e o tempo estimado de cada viagem.
async function processarAlocacoes() {
  const [pedidosPendentes, dronesDisponiveis, obstaculos] = await Promise.all([
    pedidoRepository.listarPendentes(),
    droneRepository.listarDisponiveis(),
    obstaculoRepository.listarTodos(),
  ]);

  const { viagens, naoAlocados } = alocarPedidos(pedidosPendentes, dronesDisponiveis, obstaculos);
  const dronesPorId = new Map(dronesDisponiveis.map((drone) => [drone.id, drone]));

  const viagensCriadas = [];
  for (const viagem of viagens) {
    const drone = dronesPorId.get(viagem.droneId);

    const viagemCriada = await viagemRepository.criar({
      droneId: viagem.droneId,
      pedidoIds: viagem.pedidoIds,
      distanciaTotalKm: viagem.distanciaTotal,
    });

    await Promise.all(viagem.pedidoIds.map((pedidoId) => pedidoRepository.atualizarStatus(pedidoId, 'alocado')));

    await droneRepository.atualizarAposDespacho(viagem.droneId, {
      estado: transicionar(drone.estado, 'carregando'),
      bateriaPercentual: consumirBateria(drone.bateriaPercentual, viagem.distanciaTotal, drone.alcanceKm),
    });

    const tempoEstimadoHoras = viagem.distanciaTotal / drone.velocidadeKmH;
    agendarProgressoAutomatico(viagem.droneId, tempoEstimadoHoras);

    viagensCriadas.push({
      ...viagemCriada,
      pedidoIds: viagem.pedidoIds,
      pesoTotal: viagem.pesoTotal,
      tempoEstimadoHoras,
    });
  }

  return { viagensCriadas, naoAlocados };
}

// Despacho manual: quem está operando escolhe o drone e os pedidos, em vez de rodar a
// heurística automática. Mesmas regras de capacidade/alcance/bateria de alocarPedidos,
// mas aplicadas à combinação já escolhida.
async function despacharManualmente({ droneId, pedidoIds }) {
  const drone = await droneRepository.buscarPorId(droneId);
  if (!drone) {
    throw new ErroDominio('Drone não encontrado.', 404);
  }
  if (drone.estado !== 'idle') {
    throw new ErroDominio(`Drone não está disponível para despacho (estado atual: "${drone.estado}").`, 409);
  }

  const pedidos = await Promise.all(pedidoIds.map((id) => pedidoRepository.buscarPorId(id)));
  const indiceNaoEncontrado = pedidos.findIndex((pedido) => !pedido);
  if (indiceNaoEncontrado !== -1) {
    throw new ErroDominio(`Pedido não encontrado: ${pedidoIds[indiceNaoEncontrado]}.`, 404);
  }
  const pedidoNaoPendente = pedidos.find((pedido) => pedido.status !== 'pendente');
  if (pedidoNaoPendente) {
    throw new ErroDominio(`Pedido ${pedidoNaoPendente.id} não está mais pendente (status: "${pedidoNaoPendente.status}").`, 409);
  }

  const obstaculos = await obstaculoRepository.listarTodos();
  const { distanciaTotal, pesoTotal, pedidoIdsOrdenados } = validarDespachoManual(drone, pedidos, obstaculos);

  const viagemCriada = await viagemRepository.criar({
    droneId,
    pedidoIds: pedidoIdsOrdenados,
    distanciaTotalKm: distanciaTotal,
  });

  await Promise.all(pedidoIdsOrdenados.map((pedidoId) => pedidoRepository.atualizarStatus(pedidoId, 'alocado')));

  await droneRepository.atualizarAposDespacho(droneId, {
    estado: transicionar(drone.estado, 'carregando'),
    bateriaPercentual: consumirBateria(drone.bateriaPercentual, distanciaTotal, drone.alcanceKm),
  });

  const tempoEstimadoHoras = distanciaTotal / drone.velocidadeKmH;
  agendarProgressoAutomatico(droneId, tempoEstimadoHoras);

  return {
    ...viagemCriada,
    pedidoIds: pedidoIdsOrdenados,
    pesoTotal,
    tempoEstimadoHoras,
  };
}

async function listarRotas() {
  const viagens = await viagemRepository.listarTodas();
  return Promise.all(
    viagens.map(async (viagem) => ({
      ...viagem,
      pedidos: await viagemRepository.buscarPedidosDaViagem(viagem.id),
    })),
  );
}

async function listarFilaDeEntrega() {
  const pedidosPendentes = await pedidoRepository.listarPendentes();
  return ordenarFilaDeEntrega(pedidosPendentes);
}

module.exports = { processarAlocacoes, despacharManualmente, listarRotas, listarFilaDeEntrega };
