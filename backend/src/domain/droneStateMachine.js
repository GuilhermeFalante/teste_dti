const { ErroDominio } = require('./erroDominio');
const { ESTADOS } = require('./drone');

// Idle -> Carregando -> Em voo -> Entregando -> Retornando -> Idle
const TRANSICOES_VALIDAS = {
  idle: ['carregando'],
  carregando: ['em_voo'],
  em_voo: ['entregando'],
  entregando: ['retornando'],
  retornando: ['idle'],
};

function transicionar(estadoAtual, novoEstado) {
  if (!ESTADOS.includes(novoEstado)) {
    throw new ErroDominio(`Estado "${novoEstado}" é inválido. Estados possíveis: ${ESTADOS.join(', ')}.`);
  }

  const proximosPermitidos = TRANSICOES_VALIDAS[estadoAtual] ?? [];
  if (!proximosPermitidos.includes(novoEstado)) {
    throw new ErroDominio(
      `Transição de "${estadoAtual}" para "${novoEstado}" não é permitida. A partir de "${estadoAtual}" só é possível ir para: ${proximosPermitidos.join(', ') || 'nenhum estado'}.`,
      409,
    );
  }

  return novoEstado;
}

module.exports = { TRANSICOES_VALIDAS, transicionar };
