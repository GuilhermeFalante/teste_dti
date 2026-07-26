const { validarNovoDrone, alcanceEfetivoKm, consumirBateria } = require('../src/domain/drone');
const { ErroDominio } = require('../src/domain/erroDominio');

describe('validarNovoDrone', () => {
  test('aceita velocidade padrão quando não informada', () => {
    const drone = validarNovoDrone({ nome: 'Falcon', capacidadeKg: 5, alcanceKm: 10 });
    expect(drone.velocidadeKmH).toBe(40);
  });

  test('rejeita velocidade zero ou negativa quando informada', () => {
    expect(() =>
      validarNovoDrone({ nome: 'Falcon', capacidadeKg: 5, alcanceKm: 10, velocidadeKmH: 0 }),
    ).toThrow(ErroDominio);
  });
});

describe('alcanceEfetivoKm', () => {
  test('com bateria cheia, alcance efetivo é igual ao nominal', () => {
    expect(alcanceEfetivoKm({ alcanceKm: 10, bateriaPercentual: 100 })).toBe(10);
  });

  test('com metade da bateria, alcance efetivo cai pela metade', () => {
    expect(alcanceEfetivoKm({ alcanceKm: 10, bateriaPercentual: 50 })).toBe(5);
  });
});

describe('consumirBateria', () => {
  test('percorrer o alcance nominal inteiro consome 100% da bateria', () => {
    expect(consumirBateria(100, 10, 10)).toBe(0);
  });

  test('percorrer metade do alcance nominal consome metade da bateria', () => {
    expect(consumirBateria(100, 5, 10)).toBe(50);
  });

  test('nunca fica negativa', () => {
    expect(consumirBateria(10, 100, 10)).toBe(0);
  });
});
