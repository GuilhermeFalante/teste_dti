const { menorCaminho } = require('../src/domain/dijkstra');

describe('menorCaminho', () => {
  test('encontra o caminho direto quando é o mais curto', () => {
    const grafo = {
      a: [{ para: 'b', peso: 1 }],
      b: [{ para: 'a', peso: 1 }],
    };

    expect(menorCaminho(grafo, 'a', 'b')).toBe(1);
  });

  test('prefere o caminho indireto quando é mais curto que o direto', () => {
    const grafo = {
      a: [
        { para: 'b', peso: 10 },
        { para: 'c', peso: 1 },
      ],
      b: [
        { para: 'a', peso: 10 },
        { para: 'd', peso: 1 },
      ],
      c: [
        { para: 'a', peso: 1 },
        { para: 'd', peso: 1 },
      ],
      d: [
        { para: 'b', peso: 1 },
        { para: 'c', peso: 1 },
      ],
    };

    expect(menorCaminho(grafo, 'a', 'd')).toBe(2); // a -> c -> d
  });

  test('retorna Infinity quando não há caminho possível', () => {
    const grafo = {
      a: [],
      b: [],
    };

    expect(menorCaminho(grafo, 'a', 'b')).toBe(Infinity);
  });
});
