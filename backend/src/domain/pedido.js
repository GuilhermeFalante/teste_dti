const { ErroDominio } = require('./erroDominio');

const PRIORIDADES = ['baixa', 'media', 'alta'];
const RANK_PRIORIDADE = { alta: 3, media: 2, baixa: 1 };

function validarNovoPedido({ clienteX, clienteY, pesoKg, prioridade }) {
  if (typeof clienteX !== 'number' || typeof clienteY !== 'number' || Number.isNaN(clienteX) || Number.isNaN(clienteY)) {
    throw new ErroDominio('Localização do cliente (clienteX, clienteY) deve conter números válidos.');
  }
  if (typeof pesoKg !== 'number' || Number.isNaN(pesoKg) || pesoKg <= 0) {
    throw new ErroDominio('Peso do pacote deve ser um número maior que zero.');
  }
  if (!PRIORIDADES.includes(prioridade)) {
    throw new ErroDominio(`Prioridade deve ser uma de: ${PRIORIDADES.join(', ')}.`);
  }

  return { clienteX, clienteY, pesoKg, prioridade };
}

module.exports = { PRIORIDADES, RANK_PRIORIDADE, validarNovoPedido };
