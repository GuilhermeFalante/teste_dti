import {
  RESUMO_ESTADO_DRONE,
  RESUMO_STATUS_PEDIDO,
  RESUMO_STATUS_VIAGEM,
  RESUMO_PRIORIDADE,
  rotular,
} from '../domain/rotulos';

const CORES = {
  estadoDrone: {
    idle: '#6b7280',
    carregando: '#d97706',
    em_voo: '#2563eb',
    entregando: '#7c3aed',
    retornando: '#0891b2',
  },
  statusPedido: {
    pendente: '#6b7280',
    alocado: '#d97706',
    em_rota: '#2563eb',
    entregue: '#16a34a',
  },
  statusViagem: {
    em_andamento: '#2563eb',
    concluida: '#16a34a',
  },
  prioridade: {
    alta: '#dc2626',
    media: '#d97706',
    baixa: '#6b7280',
  },
};

const ROTULOS = {
  estadoDrone: RESUMO_ESTADO_DRONE,
  statusPedido: RESUMO_STATUS_PEDIDO,
  statusViagem: RESUMO_STATUS_VIAGEM,
  prioridade: RESUMO_PRIORIDADE,
};

// Selo colorido pra qualquer status "de sistema" (estado do drone, status do pedido/viagem,
// prioridade), com texto amigável em vez do valor cru vindo da API.
function Badge({ categoria, valor }) {
  const texto = rotular(ROTULOS[categoria] ?? {}, valor);
  const cor = CORES[categoria]?.[valor] ?? '#6b7280';

  return (
    <span className="badge" style={{ color: cor, background: `${cor}1f`, borderColor: `${cor}44` }}>
      {texto}
    </span>
  );
}

export default Badge;
