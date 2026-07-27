const droneService = require('./droneService');

// Simula o tempo de voo (Idle → Carregando já aconteceu no despacho; daqui em diante o ciclo
// avança sozinho): 1 hora de voo simulada equivale a SEGUNDOS_POR_HORA_SIMULADA segundos reais,
// limitado a uma faixa curta o bastante pra dar pra acompanhar numa demo.
const SEGUNDOS_POR_HORA_SIMULADA = 60;
const DURACAO_MIN_MS = 3000;
const DURACAO_MAX_MS = 20000;
const DURACAO_CARREGANDO_MS = 3000;
const DURACAO_ENTREGANDO_MS = 3000;

function calcularDuracaoVooMs(tempoEstimadoHoras) {
  const bruta = tempoEstimadoHoras * SEGUNDOS_POR_HORA_SIMULADA * 1000;
  return Math.min(DURACAO_MAX_MS, Math.max(DURACAO_MIN_MS, bruta));
}

function aguardar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Roda em background (fire-and-forget): não bloqueia a resposta HTTP do despacho. Se alguém
// mexer manualmente no estado do drone enquanto isso roda (ou remover o drone), a próxima
// chamada a avancarEstadoDrone falha a transição e a simulação simplesmente para por ali.
async function executarProgressoAutomatico(droneId, tempoEstimadoHoras) {
  const duracaoVooMs = calcularDuracaoVooMs(tempoEstimadoHoras);
  const etapas = [
    { estado: 'em_voo', esperaMs: DURACAO_CARREGANDO_MS },
    { estado: 'entregando', esperaMs: duracaoVooMs },
    { estado: 'retornando', esperaMs: DURACAO_ENTREGANDO_MS },
    { estado: 'idle', esperaMs: duracaoVooMs },
  ];

  for (const etapa of etapas) {
    await aguardar(etapa.esperaMs);
    try {
      await droneService.avancarEstadoDrone(droneId, etapa.estado);
    } catch (erro) {
      console.error(`Simulação de voo interrompida para o drone ${droneId} (ao tentar "${etapa.estado}"): ${erro.message}`);
      return;
    }
  }
}

function agendarProgressoAutomatico(droneId, tempoEstimadoHoras) {
  executarProgressoAutomatico(droneId, tempoEstimadoHoras);
}

module.exports = { agendarProgressoAutomatico };
