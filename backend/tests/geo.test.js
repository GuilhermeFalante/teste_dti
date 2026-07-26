const { calcularDistancia, calcularDistanciaRota, segmentoIntersectaObstaculo } = require('../src/domain/geo');

describe('calcularDistancia', () => {
  test('sem obstáculos, é a distância euclidiana direta', () => {
    expect(calcularDistancia({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  test('com obstáculo fora do caminho, distância continua a euclidiana direta', () => {
    const obstaculos = [{ x: 100, y: 100, raioKm: 1 }];
    expect(calcularDistancia({ x: 0, y: 0 }, { x: 3, y: 4 }, obstaculos)).toBe(5);
  });

  test('com obstáculo bem no meio do caminho, a rota contorna e fica mais longa que a linha reta', () => {
    const obstaculos = [{ x: 5, y: 0, raioKm: 3 }];
    const distancia = calcularDistancia({ x: 0, y: 0 }, { x: 10, y: 0 }, obstaculos);
    expect(distancia).toBeGreaterThan(10);
  });
});

describe('segmentoIntersectaObstaculo', () => {
  test('detecta interseção quando o segmento passa pelo centro do círculo', () => {
    expect(segmentoIntersectaObstaculo({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 0, raioKm: 2 })).toBe(true);
  });

  test('não detecta interseção quando o círculo está fora da rota do segmento', () => {
    expect(segmentoIntersectaObstaculo({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 20, raioKm: 2 })).toBe(false);
  });
});

describe('calcularDistanciaRota', () => {
  test('ida e volta até um único ponto é o dobro da distância até ele', () => {
    const distancia = calcularDistanciaRota([{ x: 3, y: 4 }], { x: 0, y: 0 });
    expect(distancia).toBe(10);
  });
});
