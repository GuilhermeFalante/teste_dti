const { ErroDominio } = require('./erroDominio');

const ESTADOS = ['idle', 'carregando', 'em_voo', 'entregando', 'retornando'];

function validarNovoDrone({ nome, capacidadeKg, alcanceKm }) {
  if (typeof nome !== 'string' || nome.trim().length === 0) {
    throw new ErroDominio('Nome do drone é obrigatório.');
  }
  if (typeof capacidadeKg !== 'number' || Number.isNaN(capacidadeKg) || capacidadeKg <= 0) {
    throw new ErroDominio('Capacidade do drone (capacidadeKg) deve ser um número maior que zero.');
  }
  if (typeof alcanceKm !== 'number' || Number.isNaN(alcanceKm) || alcanceKm <= 0) {
    throw new ErroDominio('Alcance do drone (alcanceKm) deve ser um número maior que zero.');
  }

  return { nome: nome.trim(), capacidadeKg, alcanceKm };
}

module.exports = { ESTADOS, validarNovoDrone };
