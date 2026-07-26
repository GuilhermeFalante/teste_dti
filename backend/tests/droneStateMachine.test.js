const { transicionar } = require('../src/domain/droneStateMachine');
const { ErroDominio } = require('../src/domain/erroDominio');

describe('DroneStateMachine.transicionar', () => {
  test.each([
    ['idle', 'carregando'],
    ['carregando', 'em_voo'],
    ['em_voo', 'entregando'],
    ['entregando', 'retornando'],
    ['retornando', 'idle'],
  ])('permite transição de %s para %s', (de, para) => {
    expect(transicionar(de, para)).toBe(para);
  });

  test('rejeita pular etapas do ciclo (idle -> em_voo)', () => {
    expect(() => transicionar('idle', 'em_voo')).toThrow(ErroDominio);
  });

  test('rejeita transição para um estado desconhecido', () => {
    expect(() => transicionar('idle', 'flutuando')).toThrow(ErroDominio);
  });

  test('rejeita transição a partir de estado inválido', () => {
    expect(() => transicionar('inexistente', 'idle')).toThrow(ErroDominio);
  });
});
