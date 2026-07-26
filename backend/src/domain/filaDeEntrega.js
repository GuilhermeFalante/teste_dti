const { RANK_PRIORIDADE } = require('./pedido');

// Fila de entrega: prioridade primeiro, depois ordem de chegada (FIFO dentro da mesma prioridade).
// Distinta da ordenação usada em alocacaoService (que também considera peso, para otimizar o
// aproveitamento de capacidade dos drones) — aqui o objetivo é só mostrar a ordem de atendimento.
function ordenarFilaDeEntrega(pedidos) {
  return [...pedidos].sort((a, b) => {
    const rankDiff = RANK_PRIORIDADE[b.prioridade] - RANK_PRIORIDADE[a.prioridade];
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.criadoEm) - new Date(b.criadoEm);
  });
}

module.exports = { ordenarFilaDeEntrega };
