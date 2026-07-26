// Relatório simples a partir de dados já carregados (viagens com seus pedidos e a lista de
// drones) — puro, sem acesso a banco, pra ficar fácil de testar.
//
// "viagens" no formato de entregaService.listarRotas(): { id, droneId, status, distanciaTotalKm,
// pedidos: [{ pedidoId, ordemEntrega }] }.
function calcularRelatorio(viagens, drones) {
  const viagensConcluidas = viagens.filter((viagem) => viagem.status === 'concluida');
  const dronesPorId = new Map(drones.map((drone) => [drone.id, drone]));

  const entregasRealizadas = viagensConcluidas.reduce((soma, viagem) => soma + viagem.pedidos.length, 0);
  const tempoMedioHoras = calcularTempoMedioHoras(viagensConcluidas, dronesPorId);
  const droneMaisEficiente = encontrarDroneMaisEficiente(viagensConcluidas, dronesPorId);

  return { entregasRealizadas, tempoMedioHoras, droneMaisEficiente };
}

function calcularTempoMedioHoras(viagensConcluidas, dronesPorId) {
  const tempos = viagensConcluidas
    .map((viagem) => {
      const drone = dronesPorId.get(viagem.droneId);
      if (!drone || viagem.distanciaTotalKm == null || drone.velocidadeKmH <= 0) return null;
      return viagem.distanciaTotalKm / drone.velocidadeKmH;
    })
    .filter((tempo) => tempo !== null);

  if (tempos.length === 0) return null;
  return tempos.reduce((soma, tempo) => soma + tempo, 0) / tempos.length;
}

// "Eficiência" = pedidos entregues por km percorrido — o drone que mais entrega por unidade de
// distância voada, agregando todas as viagens concluídas dele.
function encontrarDroneMaisEficiente(viagensConcluidas, dronesPorId) {
  const estatisticasPorDrone = new Map();

  viagensConcluidas.forEach((viagem) => {
    const atual = estatisticasPorDrone.get(viagem.droneId) ?? { distanciaTotalKm: 0, pedidosEntregues: 0 };
    atual.distanciaTotalKm += viagem.distanciaTotalKm ?? 0;
    atual.pedidosEntregues += viagem.pedidos.length;
    estatisticasPorDrone.set(viagem.droneId, atual);
  });

  let melhorDroneId = null;
  let melhorEficiencia = -Infinity;

  for (const [droneId, estatisticas] of estatisticasPorDrone) {
    if (estatisticas.distanciaTotalKm <= 0) continue;
    const eficiencia = estatisticas.pedidosEntregues / estatisticas.distanciaTotalKm;
    if (eficiencia > melhorEficiencia) {
      melhorEficiencia = eficiencia;
      melhorDroneId = droneId;
    }
  }

  if (!melhorDroneId) return null;

  const drone = dronesPorId.get(melhorDroneId);
  const estatisticas = estatisticasPorDrone.get(melhorDroneId);
  return {
    id: melhorDroneId,
    nome: drone?.nome ?? melhorDroneId,
    pedidosEntregues: estatisticas.pedidosEntregues,
    distanciaTotalKm: estatisticas.distanciaTotalKm,
    pedidosEntreguesPorKm: melhorEficiencia,
  };
}

module.exports = { calcularRelatorio };
