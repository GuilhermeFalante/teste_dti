const { alocarPedidos } = require('../domain/alocacaoService');
const { transicionar } = require('../domain/droneStateMachine');
const { consumirBateria } = require('../domain/drone');
const { ordenarFilaDeEntrega } = require('../domain/filaDeEntrega');
const { droneRepository, pedidoRepository, viagemRepository, obstaculoRepository } = require('../repositories');

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

    viagensCriadas.push({
      ...viagemCriada,
      pedidoIds: viagem.pedidoIds,
      pesoTotal: viagem.pesoTotal,
      tempoEstimadoHoras: viagem.distanciaTotal / drone.velocidadeKmH,
    });
  }

  return { viagensCriadas, naoAlocados };
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

module.exports = { processarAlocacoes, listarRotas, listarFilaDeEntrega };
