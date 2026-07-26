const { calcularRelatorio } = require('../src/domain/relatorio');

function viagem(overrides) {
  return {
    id: 'viagem-1',
    droneId: 'drone-1',
    status: 'concluida',
    distanciaTotalKm: 10,
    pedidos: [{ pedidoId: 'p1', ordemEntrega: 1 }],
    ...overrides,
  };
}

function drone(overrides) {
  return { id: 'drone-1', nome: 'Falcon-1', velocidadeKmH: 40, ...overrides };
}

describe('calcularRelatorio', () => {
  test('sem viagens, tudo fica zerado/nulo', () => {
    const resultado = calcularRelatorio([], []);
    expect(resultado).toEqual({ entregasRealizadas: 0, tempoMedioHoras: null, droneMaisEficiente: null });
  });

  test('ignora viagens que ainda estão em_andamento', () => {
    const viagens = [viagem({ status: 'em_andamento' })];
    const resultado = calcularRelatorio(viagens, [drone()]);
    expect(resultado.entregasRealizadas).toBe(0);
    expect(resultado.tempoMedioHoras).toBeNull();
  });

  test('conta o total de pedidos entregues somando os pedidos de cada viagem concluída', () => {
    const viagens = [
      viagem({ id: 'v1', pedidos: [{ pedidoId: 'p1', ordemEntrega: 1 }, { pedidoId: 'p2', ordemEntrega: 2 }] }),
      viagem({ id: 'v2', pedidos: [{ pedidoId: 'p3', ordemEntrega: 1 }] }),
    ];
    const resultado = calcularRelatorio(viagens, [drone()]);
    expect(resultado.entregasRealizadas).toBe(3);
  });

  test('tempo médio é a média de distância/velocidade das viagens concluídas', () => {
    const viagens = [
      viagem({ id: 'v1', distanciaTotalKm: 40 }), // 1h a 40km/h
      viagem({ id: 'v2', distanciaTotalKm: 20 }), // 0.5h a 40km/h
    ];
    const resultado = calcularRelatorio(viagens, [drone()]);
    expect(resultado.tempoMedioHoras).toBeCloseTo(0.75);
  });

  test('aponta o drone com mais pedidos entregues por km rodado', () => {
    const viagens = [
      // drone-1: 1 pedido em 10km -> 0.1 pedido/km
      viagem({ id: 'v1', droneId: 'drone-1', distanciaTotalKm: 10, pedidos: [{ pedidoId: 'p1', ordemEntrega: 1 }] }),
      // drone-2: 2 pedidos em 5km -> 0.4 pedido/km (mais eficiente)
      viagem({
        id: 'v2',
        droneId: 'drone-2',
        distanciaTotalKm: 5,
        pedidos: [
          { pedidoId: 'p2', ordemEntrega: 1 },
          { pedidoId: 'p3', ordemEntrega: 2 },
        ],
      }),
    ];
    const drones = [drone({ id: 'drone-1', nome: 'Falcon-1' }), drone({ id: 'drone-2', nome: 'Falcon-2' })];

    const resultado = calcularRelatorio(viagens, drones);

    expect(resultado.droneMaisEficiente).toMatchObject({
      id: 'drone-2',
      nome: 'Falcon-2',
      pedidosEntregues: 2,
      distanciaTotalKm: 5,
    });
  });
});
