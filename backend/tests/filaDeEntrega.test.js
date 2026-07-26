const { ordenarFilaDeEntrega } = require('../src/domain/filaDeEntrega');

function pedido(overrides) {
  return {
    id: 'p1',
    prioridade: 'media',
    criadoEm: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('ordenarFilaDeEntrega', () => {
  test('prioriza prioridade alta antes de média e baixa', () => {
    const baixa = pedido({ id: 'baixa', prioridade: 'baixa' });
    const alta = pedido({ id: 'alta', prioridade: 'alta' });
    const media = pedido({ id: 'media', prioridade: 'media' });

    const resultado = ordenarFilaDeEntrega([baixa, media, alta]);

    expect(resultado.map((p) => p.id)).toEqual(['alta', 'media', 'baixa']);
  });

  test('com a mesma prioridade, respeita ordem de chegada (FIFO)', () => {
    const primeiro = pedido({ id: 'primeiro', criadoEm: '2026-01-01T00:00:00Z' });
    const segundo = pedido({ id: 'segundo', criadoEm: '2026-01-01T01:00:00Z' });

    const resultado = ordenarFilaDeEntrega([segundo, primeiro]);

    expect(resultado.map((p) => p.id)).toEqual(['primeiro', 'segundo']);
  });
});
