const { alocarPedidos, ordenarPedidosParaAlocacao } = require('../src/domain/alocacaoService');

function pedido(overrides) {
  return {
    id: 'pedido-1',
    clienteX: 0,
    clienteY: 0,
    pesoKg: 1,
    prioridade: 'media',
    criadoEm: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function drone(overrides) {
  return {
    id: 'drone-1',
    capacidadeKg: 10,
    alcanceKm: 10,
    ...overrides,
  };
}

describe('ordenarPedidosParaAlocacao', () => {
  test('prioriza prioridade alta antes de média e baixa', () => {
    const baixa = pedido({ id: 'baixa', prioridade: 'baixa' });
    const alta = pedido({ id: 'alta', prioridade: 'alta' });
    const media = pedido({ id: 'media', prioridade: 'media' });

    const resultado = ordenarPedidosParaAlocacao([baixa, media, alta]);

    expect(resultado.map((p) => p.id)).toEqual(['alta', 'media', 'baixa']);
  });

  test('com prioridade igual, prioriza maior peso primeiro', () => {
    const leve = pedido({ id: 'leve', pesoKg: 1 });
    const pesado = pedido({ id: 'pesado', pesoKg: 5 });

    const resultado = ordenarPedidosParaAlocacao([leve, pesado]);

    expect(resultado.map((p) => p.id)).toEqual(['pesado', 'leve']);
  });
});

describe('alocarPedidos', () => {
  test('aloca um único pedido dentro da capacidade e alcance de um drone', () => {
    const pedidos = [pedido({ id: 'p1', clienteX: 3, clienteY: 4, pesoKg: 2 })];
    const drones = [drone({ id: 'd1', capacidadeKg: 5, alcanceKm: 20 })];

    const resultado = alocarPedidos(pedidos, drones);

    expect(resultado.naoAlocados).toHaveLength(0);
    expect(resultado.viagens).toHaveLength(1);
    expect(resultado.viagens[0]).toMatchObject({ droneId: 'd1', pedidoIds: ['p1'] });
  });

  test('agrupa múltiplos pedidos na mesma viagem quando cabem no mesmo drone', () => {
    const pedidos = [
      pedido({ id: 'p1', clienteX: 1, clienteY: 0, pesoKg: 2 }),
      pedido({ id: 'p2', clienteX: 2, clienteY: 0, pesoKg: 2 }),
    ];
    const drones = [drone({ id: 'd1', capacidadeKg: 5, alcanceKm: 20 })];

    const resultado = alocarPedidos(pedidos, drones);

    expect(resultado.viagens).toHaveLength(1);
    expect(resultado.viagens[0].pedidoIds.sort()).toEqual(['p1', 'p2']);
  });

  test('abre uma nova viagem quando a capacidade do drone estoura', () => {
    const pedidos = [
      pedido({ id: 'p1', clienteX: 1, clienteY: 0, pesoKg: 4 }),
      pedido({ id: 'p2', clienteX: 2, clienteY: 0, pesoKg: 4 }),
    ];
    const drones = [
      drone({ id: 'd1', capacidadeKg: 5, alcanceKm: 20 }),
      drone({ id: 'd2', capacidadeKg: 5, alcanceKm: 20 }),
    ];

    const resultado = alocarPedidos(pedidos, drones);

    expect(resultado.viagens).toHaveLength(2);
    const droneIds = resultado.viagens.map((v) => v.droneId).sort();
    expect(droneIds).toEqual(['d1', 'd2']);
  });

  test('marca como não alocado um pedido que ultrapassa a capacidade de todos os drones', () => {
    const pedidos = [pedido({ id: 'p1', pesoKg: 100 })];
    const drones = [drone({ id: 'd1', capacidadeKg: 5, alcanceKm: 20 })];

    const resultado = alocarPedidos(pedidos, drones);

    expect(resultado.viagens).toHaveLength(0);
    expect(resultado.naoAlocados).toEqual([
      { pedidoId: 'p1', motivo: expect.stringContaining('Nenhum drone') },
    ]);
  });

  test('marca como não alocado um pedido fora do alcance de todos os drones', () => {
    const pedidos = [pedido({ id: 'p1', clienteX: 100, clienteY: 100, pesoKg: 1 })];
    const drones = [drone({ id: 'd1', capacidadeKg: 10, alcanceKm: 5 })];

    const resultado = alocarPedidos(pedidos, drones);

    expect(resultado.viagens).toHaveLength(0);
    expect(resultado.naoAlocados[0].pedidoId).toBe('p1');
  });

  test('sem drones disponíveis, todos os pedidos ficam não alocados', () => {
    const pedidos = [pedido({ id: 'p1' }), pedido({ id: 'p2' })];

    const resultado = alocarPedidos(pedidos, []);

    expect(resultado.viagens).toHaveLength(0);
    expect(resultado.naoAlocados).toHaveLength(2);
  });

  test('escolhe o menor drone suficiente, poupando o maior para pedidos mais pesados', () => {
    const pedidos = [pedido({ id: 'leve', pesoKg: 1, prioridade: 'alta' })];
    const drones = [
      drone({ id: 'pequeno', capacidadeKg: 2, alcanceKm: 20 }),
      drone({ id: 'grande', capacidadeKg: 20, alcanceKm: 20 }),
    ];

    const resultado = alocarPedidos(pedidos, drones);

    expect(resultado.viagens[0].droneId).toBe('pequeno');
  });
});
