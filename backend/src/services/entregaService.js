const { alocarPedidos } = require('../domain/alocacaoService');
const { transicionar } = require('../domain/droneStateMachine');
const { droneRepository, pedidoRepository, viagemRepository } = require('../repositories');

// Orquestra o passo principal do desafio: pega pedidos pendentes + drones livres,
// roda a heurística de alocação (domínio puro) e persiste o resultado.
async function processarAlocacoes() {
  const [pedidosPendentes, dronesDisponiveis] = await Promise.all([
    pedidoRepository.listarPendentes(),
    droneRepository.listarDisponiveis(),
  ]);

  const { viagens, naoAlocados } = alocarPedidos(pedidosPendentes, dronesDisponiveis);

  const viagensCriadas = [];
  for (const viagem of viagens) {
    const viagemCriada = await viagemRepository.criar({
      droneId: viagem.droneId,
      pedidoIds: viagem.pedidoIds,
      distanciaTotalKm: viagem.distanciaTotal,
    });

    await Promise.all(viagem.pedidoIds.map((pedidoId) => pedidoRepository.atualizarStatus(pedidoId, 'alocado')));
    await droneRepository.atualizarEstado(viagem.droneId, transicionar('idle', 'carregando'));

    viagensCriadas.push({ ...viagemCriada, pedidoIds: viagem.pedidoIds, pesoTotal: viagem.pesoTotal });
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

module.exports = { processarAlocacoes, listarRotas };
