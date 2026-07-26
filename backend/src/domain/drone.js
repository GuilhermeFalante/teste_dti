const { ErroDominio } = require('./erroDominio');

const ESTADOS = ['idle', 'carregando', 'em_voo', 'entregando', 'retornando'];
const VELOCIDADE_PADRAO_KMH = 40;

function validarNovoDrone({ nome, capacidadeKg, alcanceKm, velocidadeKmH = VELOCIDADE_PADRAO_KMH }) {
  if (typeof nome !== 'string' || nome.trim().length === 0) {
    throw new ErroDominio('Nome do drone é obrigatório.');
  }
  if (typeof capacidadeKg !== 'number' || Number.isNaN(capacidadeKg) || capacidadeKg <= 0) {
    throw new ErroDominio('Capacidade do drone (capacidadeKg) deve ser um número maior que zero.');
  }
  if (typeof alcanceKm !== 'number' || Number.isNaN(alcanceKm) || alcanceKm <= 0) {
    throw new ErroDominio('Alcance do drone (alcanceKm) deve ser um número maior que zero.');
  }
  if (typeof velocidadeKmH !== 'number' || Number.isNaN(velocidadeKmH) || velocidadeKmH <= 0) {
    throw new ErroDominio('Velocidade do drone (velocidadeKmH) deve ser um número maior que zero.');
  }

  return { nome: nome.trim(), capacidadeKg, alcanceKm, velocidadeKmH };
}

// Alcance restante considerando a bateria atual: um drone com metade da bateria
// só consegue percorrer, com segurança, metade do seu alcance nominal.
function alcanceEfetivoKm(drone) {
  return drone.alcanceKm * (drone.bateriaPercentual / 100);
}

// Consumo proporcional: percorrer o alcance nominal inteiro gasta 100% da bateria.
function consumirBateria(bateriaPercentual, distanciaPercorridaKm, alcanceKm) {
  if (alcanceKm <= 0) return bateriaPercentual;
  const consumo = (distanciaPercorridaKm / alcanceKm) * 100;
  return Math.max(0, bateriaPercentual - consumo);
}

module.exports = { ESTADOS, VELOCIDADE_PADRAO_KMH, validarNovoDrone, alcanceEfetivoKm, consumirBateria };
