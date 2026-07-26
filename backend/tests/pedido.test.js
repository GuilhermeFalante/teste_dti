const { validarNovoPedido } = require('../src/domain/pedido');
const { ErroDominio } = require('../src/domain/erroDominio');

describe('validarNovoPedido', () => {
  test('aceita um pedido válido', () => {
    const pedido = validarNovoPedido({ clienteX: 1, clienteY: 2, pesoKg: 3, prioridade: 'alta' });
    expect(pedido).toEqual({ clienteX: 1, clienteY: 2, pesoKg: 3, prioridade: 'alta' });
  });

  test('rejeita peso zero ou negativo', () => {
    expect(() => validarNovoPedido({ clienteX: 0, clienteY: 0, pesoKg: 0, prioridade: 'alta' })).toThrow(ErroDominio);
    expect(() => validarNovoPedido({ clienteX: 0, clienteY: 0, pesoKg: -1, prioridade: 'alta' })).toThrow(ErroDominio);
  });

  test('rejeita prioridade inválida', () => {
    expect(() => validarNovoPedido({ clienteX: 0, clienteY: 0, pesoKg: 1, prioridade: 'urgente' })).toThrow(ErroDominio);
  });

  test('rejeita coordenadas não numéricas', () => {
    expect(() => validarNovoPedido({ clienteX: 'a', clienteY: 0, pesoKg: 1, prioridade: 'alta' })).toThrow(ErroDominio);
  });
});
