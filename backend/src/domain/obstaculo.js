const { ErroDominio } = require('./erroDominio');

function validarNovoObstaculo({ nome, centroX, centroY, raioKm }) {
  if (typeof nome !== 'string' || nome.trim().length === 0) {
    throw new ErroDominio('Nome do obstáculo é obrigatório.');
  }
  if (typeof centroX !== 'number' || typeof centroY !== 'number' || Number.isNaN(centroX) || Number.isNaN(centroY)) {
    throw new ErroDominio('Centro do obstáculo (centroX, centroY) deve conter números válidos.');
  }
  if (typeof raioKm !== 'number' || Number.isNaN(raioKm) || raioKm <= 0) {
    throw new ErroDominio('Raio do obstáculo (raioKm) deve ser um número maior que zero.');
  }

  return { nome: nome.trim(), centroX, centroY, raioKm };
}

module.exports = { validarNovoObstaculo };
