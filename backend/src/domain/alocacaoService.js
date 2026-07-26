const { RANK_PRIORIDADE } = require('./pedido');
const { calcularDistanciaRota, ordenarRotaVizinhoMaisProximo } = require('./geo');

const BASE_PADRAO = { x: 0, y: 0 };

// Prioridade > peso (maior primeiro, para maximizar aproveitamento de capacidade) > ordem de chegada.
function ordenarPedidosParaAlocacao(pedidos) {
  return [...pedidos].sort((a, b) => {
    const rankDiff = RANK_PRIORIDADE[b.prioridade] - RANK_PRIORIDADE[a.prioridade];
    if (rankDiff !== 0) return rankDiff;
    const pesoDiff = b.pesoKg - a.pesoKg;
    if (pesoDiff !== 0) return pesoDiff;
    return new Date(a.criadoEm) - new Date(b.criadoEm);
  });
}

// Heurística gulosa (first-fit decreasing adaptado): tenta encaixar cada pedido em uma
// viagem já aberta antes de abrir uma nova, para minimizar o número total de viagens.
// Cada drone participa de no máximo uma viagem por execução (viagens seguintes do mesmo
// drone acontecem em rodadas futuras, quando ele estiver "idle" novamente).
function alocarPedidos(pedidos, drones, base = BASE_PADRAO) {
  const dronesDoMenorParaOMaior = [...drones].sort((a, b) => a.capacidadeKg - b.capacidadeKg);
  const pedidosOrdenados = ordenarPedidosParaAlocacao(pedidos);

  const viagens = [];
  const naoAlocados = [];

  pedidosOrdenados.forEach((pedido) => {
    const ponto = { x: pedido.clienteX, y: pedido.clienteY };
    const viagemComEspaco = encontrarViagemComEspaco(viagens, pedido, ponto, base);

    if (viagemComEspaco) {
      viagemComEspaco.pedidos.push(pedido);
      viagemComEspaco.pesoTotal += pedido.pesoKg;
      viagemComEspaco.distanciaTotal = viagemComEspaco.novaDistancia;
      return;
    }

    const droneParaNovaViagem = encontrarDroneParaNovaViagem(dronesDoMenorParaOMaior, viagens, pedido, ponto, base);
    if (droneParaNovaViagem) {
      viagens.push({
        drone: droneParaNovaViagem,
        pedidos: [pedido],
        pesoTotal: pedido.pesoKg,
        distanciaTotal: calcularDistanciaRota([ponto], base),
      });
      return;
    }

    naoAlocados.push({
      pedido,
      motivo: 'Nenhum drone disponível suporta o peso e/ou o alcance necessário para este pedido.',
    });
  });

  return {
    viagens: viagens.map((v) => ({
      droneId: v.drone.id,
      pedidoIds: v.pedidos.map((p) => p.id),
      pesoTotal: v.pesoTotal,
      distanciaTotal: v.distanciaTotal,
    })),
    naoAlocados: naoAlocados.map((n) => ({ pedidoId: n.pedido.id, motivo: n.motivo })),
  };
}

function encontrarViagemComEspaco(viagens, pedido, ponto, base) {
  for (const viagem of viagens) {
    const novoPeso = viagem.pesoTotal + pedido.pesoKg;
    if (novoPeso > viagem.drone.capacidadeKg) continue;

    const pontosDaViagem = viagem.pedidos.map((p) => ({ x: p.clienteX, y: p.clienteY }));
    const rota = ordenarRotaVizinhoMaisProximo([...pontosDaViagem, ponto], base);
    const novaDistancia = calcularDistanciaRota(rota, base);
    if (novaDistancia > viagem.drone.alcanceKm) continue;

    viagem.novaDistancia = novaDistancia;
    return viagem;
  }
  return null;
}

function encontrarDroneParaNovaViagem(dronesDoMenorParaOMaior, viagens, pedido, ponto, base) {
  const distanciaSolo = calcularDistanciaRota([ponto], base);
  return dronesDoMenorParaOMaior.find((drone) => {
    const jaUsadoNestaRodada = viagens.some((v) => v.drone.id === drone.id);
    if (jaUsadoNestaRodada) return false;
    if (pedido.pesoKg > drone.capacidadeKg) return false;
    if (distanciaSolo > drone.alcanceKm) return false;
    return true;
  }) ?? null;
}

module.exports = { ordenarPedidosParaAlocacao, alocarPedidos };
