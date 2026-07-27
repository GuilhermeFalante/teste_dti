// Rótulos amigáveis pros valores "de sistema" que vêm da API — o cliente não precisa ver
// snake_case (em_andamento, em_rota etc.), só o texto em português.
export const RESUMO_ESTADO_DRONE = {
  idle: 'Disponível',
  carregando: 'Carregando',
  em_voo: 'Em voo',
  entregando: 'Entregando',
  retornando: 'Retornando',
};

export const RESUMO_STATUS_PEDIDO = {
  pendente: 'Pendente',
  alocado: 'Alocado',
  em_rota: 'Em rota',
  entregue: 'Entregue',
};

export const RESUMO_STATUS_VIAGEM = {
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
};

export const RESUMO_PRIORIDADE = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export function rotular(mapa, valor) {
  return mapa[valor] ?? valor;
}
