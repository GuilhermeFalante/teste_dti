const { RANK_PRIORIDADE } = require('./pedido');
const { alcanceEfetivoKm } = require('./drone');
const { calcularDistanciaRota, ordenarRotaVizinhoMaisProximo } = require('./geo');
const { ErroDominio } = require('./erroDominio');

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
// O alcance considerado é o efetivo (afetado pela bateria atual), e a distância das rotas
// já contorna eventuais obstáculos (zonas de exclusão aérea) informados.
function alocarPedidos(pedidos, drones, obstaculos = [], base = BASE_PADRAO) {
  const dronesDoMenorParaOMaior = [...drones].sort((a, b) => a.capacidadeKg - b.capacidadeKg);
  const pedidosOrdenados = ordenarPedidosParaAlocacao(pedidos);

  const viagens = [];
  const naoAlocados = [];

  pedidosOrdenados.forEach((pedido) => {
    const ponto = { x: pedido.clienteX, y: pedido.clienteY };
    const viagemComEspaco = encontrarViagemComEspaco(viagens, pedido, ponto, base, obstaculos);

    if (viagemComEspaco) {
      viagemComEspaco.pedidos.push(pedido);
      viagemComEspaco.pesoTotal += pedido.pesoKg;
      viagemComEspaco.distanciaTotal = viagemComEspaco.novaDistancia;
      return;
    }

    const droneParaNovaViagem = encontrarDroneParaNovaViagem(dronesDoMenorParaOMaior, viagens, pedido, ponto, base, obstaculos);
    if (droneParaNovaViagem) {
      viagens.push({
        drone: droneParaNovaViagem,
        pedidos: [pedido],
        pesoTotal: pedido.pesoKg,
        distanciaTotal: calcularDistanciaRota([ponto], base, obstaculos),
      });
      return;
    }

    naoAlocados.push({
      pedido,
      motivo: construirMotivoRejeicao(pedido, ponto, dronesDoMenorParaOMaior, obstaculos, base),
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

// Explica por que um pedido não coube em nenhuma viagem, distinguindo as causas possíveis:
// peso acima da capacidade de qualquer drone, distância acima do alcance de qualquer drone
// (destacando quando um obstáculo é o motivo de a rota ter ficado mais longa), ou — quando
// existe drone capaz — todos já terem sido usados nesta mesma rodada de alocação.
function construirMotivoRejeicao(pedido, ponto, dronesDoMenorParaOMaior, obstaculos, base) {
  if (dronesDoMenorParaOMaior.length === 0) {
    return 'Nenhum drone disponível no momento.';
  }

  const distanciaSemObstaculos = calcularDistanciaRota([ponto], base, []);
  const distanciaComObstaculos = calcularDistanciaRota([ponto], base, obstaculos);
  const obstaculoAtrapalhou = distanciaComObstaculos > distanciaSemObstaculos + 0.001;

  const capazes = dronesDoMenorParaOMaior.filter(
    (drone) => pedido.pesoKg <= drone.capacidadeKg && distanciaComObstaculos <= alcanceEfetivoKm(drone),
  );

  if (capazes.length > 0) {
    return (
      'Existe drone com capacidade e alcance suficientes para este pedido, mas todos já foram ' +
      'alocados para outra entrega nesta rodada — tente rodar a alocação de novo depois (quando ' +
      'algum drone estiver livre) ou despache este pedido manualmente.'
    );
  }

  const motivos = [];
  const maiorCapacidadeKg = Math.max(...dronesDoMenorParaOMaior.map((drone) => drone.capacidadeKg));
  if (pedido.pesoKg > maiorCapacidadeKg) {
    motivos.push(`o peso do pacote (${pedido.pesoKg}kg) excede a capacidade do maior drone disponível (${maiorCapacidadeKg}kg)`);
  }

  const maiorAlcanceEfetivoKm = Math.max(...dronesDoMenorParaOMaior.map((drone) => alcanceEfetivoKm(drone)));
  if (distanciaComObstaculos > maiorAlcanceEfetivoKm) {
    if (!Number.isFinite(distanciaComObstaculos)) {
      motivos.push(
        'zonas de exclusão aérea cercam o cliente por completo — não existe nenhuma rota possível até ele',
      );
    } else if (obstaculoAtrapalhou) {
      motivos.push(
        `a rota até o cliente precisa contornar uma zona de exclusão aérea (obstáculo), o que aumenta a ` +
          `distância de ${distanciaSemObstaculos.toFixed(2)}km para ${distanciaComObstaculos.toFixed(2)}km — acima ` +
          'do alcance disponível (considerando a bateria atual) de qualquer drone',
      );
    } else {
      motivos.push(
        `a distância até o cliente (${distanciaComObstaculos.toFixed(2)}km) excede o alcance disponível ` +
          '(considerando a bateria atual) de qualquer drone',
      );
    }
  }

  return `Nenhum drone suporta este pedido: ${motivos.join('; ')}.`;
}

function encontrarViagemComEspaco(viagens, pedido, ponto, base, obstaculos) {
  for (const viagem of viagens) {
    const novoPeso = viagem.pesoTotal + pedido.pesoKg;
    if (novoPeso > viagem.drone.capacidadeKg) continue;

    const pontosDaViagem = viagem.pedidos.map((p) => ({ x: p.clienteX, y: p.clienteY }));
    const rota = ordenarRotaVizinhoMaisProximo([...pontosDaViagem, ponto], base, obstaculos);
    const novaDistancia = calcularDistanciaRota(rota, base, obstaculos);
    if (novaDistancia > alcanceEfetivoKm(viagem.drone)) continue;

    viagem.novaDistancia = novaDistancia;
    return viagem;
  }
  return null;
}

function encontrarDroneParaNovaViagem(dronesDoMenorParaOMaior, viagens, pedido, ponto, base, obstaculos) {
  const distanciaSolo = calcularDistanciaRota([ponto], base, obstaculos);
  return dronesDoMenorParaOMaior.find((drone) => {
    const jaUsadoNestaRodada = viagens.some((v) => v.drone.id === drone.id);
    if (jaUsadoNestaRodada) return false;
    if (pedido.pesoKg > drone.capacidadeKg) return false;
    if (distanciaSolo > alcanceEfetivoKm(drone)) return false;
    return true;
  }) ?? null;
}

// Valida uma escolha manual de drone + pedidos (em vez da heurística automática de
// alocarPedidos): mesmas regras de capacidade e alcance efetivo, mas para uma combinação
// já decidida por quem está operando. Retorna a rota (ordem de entrega) e os totais.
function validarDespachoManual(drone, pedidos, obstaculos = [], base = BASE_PADRAO) {
  const pesoTotal = pedidos.reduce((soma, pedido) => soma + pedido.pesoKg, 0);
  if (pesoTotal > drone.capacidadeKg) {
    throw new ErroDominio(
      `Peso total dos pedidos (${pesoTotal}kg) excede a capacidade do drone (${drone.capacidadeKg}kg).`,
      422,
    );
  }

  const pontos = pedidos.map((pedido) => ({ x: pedido.clienteX, y: pedido.clienteY, pedidoId: pedido.id }));
  const rota = ordenarRotaVizinhoMaisProximo(pontos, base, obstaculos);
  const distanciaTotal = calcularDistanciaRota(rota, base, obstaculos);
  const alcanceDisponivel = alcanceEfetivoKm(drone);

  if (distanciaTotal > alcanceDisponivel) {
    throw new ErroDominio(
      `Distância da rota (${distanciaTotal.toFixed(2)}km) excede o alcance disponível do drone ` +
        `(${alcanceDisponivel.toFixed(2)}km, considerando a bateria atual em ${drone.bateriaPercentual}%).`,
      422,
    );
  }

  return { distanciaTotal, pesoTotal, pedidoIdsOrdenados: rota.map((ponto) => ponto.pedidoId) };
}

module.exports = { ordenarPedidosParaAlocacao, alocarPedidos, validarDespachoManual };
