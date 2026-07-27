const { alocarPedidos, ordenarPedidosParaAlocacao, validarDespachoManual } = require('../src/domain/alocacaoService');
const { ErroDominio } = require('../src/domain/erroDominio');

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
    bateriaPercentual: 100,
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

  test('marca como não alocado um pedido fora do alcance de todos os drones, sem mencionar obstáculo', () => {
    const pedidos = [pedido({ id: 'p1', clienteX: 100, clienteY: 100, pesoKg: 1 })];
    const drones = [drone({ id: 'd1', capacidadeKg: 10, alcanceKm: 5 })];

    const resultado = alocarPedidos(pedidos, drones);

    expect(resultado.viagens).toHaveLength(0);
    expect(resultado.naoAlocados[0].pedidoId).toBe('p1');
    expect(resultado.naoAlocados[0].motivo).toContain('excede o alcance disponível');
    expect(resultado.naoAlocados[0].motivo).not.toContain('obstáculo');
  });

  test('motivo da rejeição menciona obstáculo quando ele é o responsável por estourar o alcance', () => {
    const pedidos = [pedido({ id: 'p1', clienteX: 10, clienteY: 0, pesoKg: 1 })];
    const drones = [drone({ id: 'd1', capacidadeKg: 10, alcanceKm: 20.2 })]; // reto (ida e volta): 20km, cabe
    const obstaculos = [{ x: 5, y: 0, raioKm: 1 }]; // pequeno o bastante pra contornar, mas já estoura o alcance

    const resultado = alocarPedidos(pedidos, drones, obstaculos);

    expect(resultado.viagens).toHaveLength(0);
    expect(resultado.naoAlocados[0].motivo).toContain('zona de exclusão aérea');
  });

  test('motivo da rejeição não quebra (nem mostra "Infinitykm") quando o cliente fica cercado por obstáculo', () => {
    const pedidos = [pedido({ id: 'p1', clienteX: 8, clienteY: 0, pesoKg: 1 })];
    const drones = [drone({ id: 'd1', capacidadeKg: 10, alcanceKm: 100 })];
    const obstaculos = [{ x: 8, y: 0, raioKm: 2 }]; // obstáculo bem em cima do cliente: nenhuma rota chega até ele

    const resultado = alocarPedidos(pedidos, drones, obstaculos);

    expect(resultado.viagens).toHaveLength(0);
    expect(resultado.naoAlocados[0].motivo).not.toContain('Infinity');
    expect(resultado.naoAlocados[0].motivo).toContain('não existe nenhuma rota possível');
  });

  test('motivo da rejeição avisa quando existe drone capaz mas todos já foram usados na rodada', () => {
    const pedidos = [
      pedido({ id: 'p1', clienteX: 1, clienteY: 0, pesoKg: 1, prioridade: 'alta' }),
      pedido({ id: 'p2', clienteX: 2, clienteY: 0, pesoKg: 1, prioridade: 'alta' }),
    ];
    const drones = [drone({ id: 'd1', capacidadeKg: 1, alcanceKm: 10 })]; // só 1 drone, capacidade justa pra 1 pedido por vez

    const resultado = alocarPedidos(pedidos, drones);

    expect(resultado.viagens).toHaveLength(1);
    expect(resultado.naoAlocados).toHaveLength(1);
    expect(resultado.naoAlocados[0].motivo).toContain('já foram alocados para outra entrega nesta rodada');
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

  test('bateria baixa reduz o alcance efetivo e pode inviabilizar um pedido que caberia com bateria cheia', () => {
    const pedidos = [pedido({ id: 'p1', clienteX: 8, clienteY: 0, pesoKg: 1 })];
    const drones = [drone({ id: 'd1', alcanceKm: 10, bateriaPercentual: 50 })]; // alcance efetivo: 5km, viagem: 16km

    const resultado = alocarPedidos(pedidos, drones);

    expect(resultado.viagens).toHaveLength(0);
    expect(resultado.naoAlocados[0].pedidoId).toBe('p1');
  });

  test('um obstáculo entre a base e o cliente aumenta a distância real da rota, podendo estourar o alcance', () => {
    const pedidos = [pedido({ id: 'p1', clienteX: 10, clienteY: 0, pesoKg: 1 })];
    const drones = [drone({ id: 'd1', alcanceKm: 21 })]; // ida e volta em linha reta: 20km, cabe com folga
    const obstaculos = [{ x: 5, y: 0, raioKm: 1 }]; // bem no meio do caminho, mas pequeno o bastante pra contornar e ainda caber

    const resultado = alocarPedidos(pedidos, drones, obstaculos);

    expect(resultado.viagens).toHaveLength(1);
    expect(resultado.viagens[0].distanciaTotal).toBeGreaterThan(20);
  });
});

describe('validarDespachoManual', () => {
  test('aceita uma combinação de pedidos dentro da capacidade e do alcance', () => {
    const pedidos = [
      pedido({ id: 'p1', clienteX: 3, clienteY: 0, pesoKg: 2 }),
      pedido({ id: 'p2', clienteX: 4, clienteY: 0, pesoKg: 2 }),
    ];
    const droneEscolhido = drone({ id: 'd1', capacidadeKg: 5, alcanceKm: 20 });

    const resultado = validarDespachoManual(droneEscolhido, pedidos);

    expect(resultado.pesoTotal).toBe(4);
    expect(resultado.pedidoIdsOrdenados.sort()).toEqual(['p1', 'p2']);
    expect(resultado.distanciaTotal).toBeGreaterThan(0);
  });

  test('rejeita quando o peso total excede a capacidade do drone', () => {
    const pedidos = [pedido({ id: 'p1', pesoKg: 4 }), pedido({ id: 'p2', pesoKg: 4 })];
    const droneEscolhido = drone({ id: 'd1', capacidadeKg: 5 });

    expect(() => validarDespachoManual(droneEscolhido, pedidos)).toThrow(ErroDominio);
  });

  test('rejeita quando a distância da rota excede o alcance efetivo (considerando bateria)', () => {
    const pedidos = [pedido({ id: 'p1', clienteX: 8, clienteY: 0, pesoKg: 1 })];
    const droneEscolhido = drone({ id: 'd1', alcanceKm: 10, bateriaPercentual: 50 }); // efetivo: 5km, viagem: 16km

    expect(() => validarDespachoManual(droneEscolhido, pedidos)).toThrow(ErroDominio);
  });

  test('ordena os pedidos pela rota (vizinho mais próximo), não pela ordem de entrada', () => {
    const pedidos = [
      pedido({ id: 'longe', clienteX: 10, clienteY: 0, pesoKg: 1 }),
      pedido({ id: 'perto', clienteX: 2, clienteY: 0, pesoKg: 1 }),
    ];
    const droneEscolhido = drone({ id: 'd1', capacidadeKg: 5, alcanceKm: 50 });

    const resultado = validarDespachoManual(droneEscolhido, pedidos);

    expect(resultado.pedidoIdsOrdenados).toEqual(['perto', 'longe']);
  });
});
