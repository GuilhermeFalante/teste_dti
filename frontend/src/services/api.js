const URL_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

async function requisitar(caminho, opcoes) {
  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  });

  const corpo = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(corpo?.erro ?? `Erro ${resposta.status} ao chamar ${caminho}`);
  }

  return corpo;
}

const api = {
  listarDrones: () => requisitar('/drones/status'),
  criarDrone: (dados) => requisitar('/drones', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarDrone: (id, dados) => requisitar(`/drones/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerDrone: (id) => requisitar(`/drones/${id}`, { method: 'DELETE' }),
  avancarEstadoDrone: (id, estado) =>
    requisitar(`/drones/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),

  listarPedidos: () => requisitar('/pedidos'),
  criarPedido: (dados) => requisitar('/pedidos', { method: 'POST', body: JSON.stringify(dados) }),
  removerPedido: (id) => requisitar(`/pedidos/${id}`, { method: 'DELETE' }),

  listarObstaculos: () => requisitar('/obstaculos'),
  criarObstaculo: (dados) => requisitar('/obstaculos', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarObstaculo: (id, dados) => requisitar(`/obstaculos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerObstaculo: (id) => requisitar(`/obstaculos/${id}`, { method: 'DELETE' }),

  listarFilaDeEntrega: () => requisitar('/entregas/fila'),
  listarRotas: () => requisitar('/entregas/rota'),
  alocarEntregas: () => requisitar('/entregas/alocar', { method: 'POST' }),
  despacharEntrega: (dados) => requisitar('/entregas/despachar', { method: 'POST', body: JSON.stringify(dados) }),

  buscarRelatorio: () => requisitar('/relatorio'),
};

export default api;
