import { useMemo } from 'react';

const LARGURA = 640;
const ALTURA = 480;
const PADDING = 24;

const CORES_PRIORIDADE = { alta: '#e5484d', media: '#f5a623', baixa: '#8f8f96' };
const CORES_ROTA = ['#3b82f6', '#10b981', '#a855f7', '#f97316', '#06b6d4', '#ec4899'];

function calcularEscala(pedidos, obstaculos) {
  const xs = [0, ...pedidos.map((p) => p.clienteX), ...obstaculos.flatMap((o) => [o.x - o.raioKm, o.x + o.raioKm])];
  const ys = [0, ...pedidos.map((p) => p.clienteY), ...obstaculos.flatMap((o) => [o.y - o.raioKm, o.y + o.raioKm])];

  const margem = 2;
  const minX = Math.min(...xs) - margem;
  const maxX = Math.max(...xs) + margem;
  const minY = Math.min(...ys) - margem;
  const maxY = Math.max(...ys) + margem;

  const escalaX = (LARGURA - 2 * PADDING) / (maxX - minX || 1);
  const escalaY = (ALTURA - 2 * PADDING) / (maxY - minY || 1);
  const escala = Math.min(escalaX, escalaY);

  return (x, y) => ({
    cx: PADDING + (x - minX) * escala,
    cy: ALTURA - PADDING - (y - minY) * escala,
  });
}

function MapaEntregas({ pedidos, obstaculos, rotas }) {
  const projetar = useMemo(() => calcularEscala(pedidos, obstaculos), [pedidos, obstaculos]);

  return (
    <section className="painel">
      <h2>Mapa</h2>
      <svg width={LARGURA} height={ALTURA} className="mapa-svg" role="img" aria-label="Mapa das entregas">
        {obstaculos.map((obstaculo) => {
          const { cx, cy } = projetar(obstaculo.x, obstaculo.y);
          const raioPixels = obstaculo.raioKm * Math.abs(projetar(1, 0).cx - projetar(0, 0).cx);
          return (
            <circle
              key={obstaculo.id}
              cx={cx}
              cy={cy}
              r={raioPixels}
              fill="rgba(229, 72, 77, 0.15)"
              stroke="#e5484d"
              strokeDasharray="4 3"
            >
              <title>{obstaculo.nome}</title>
            </circle>
          );
        })}

        {rotas.map((viagem, indice) => {
          const cor = CORES_ROTA[indice % CORES_ROTA.length];
          const base = projetar(0, 0);
          const pontos = [...viagem.pedidos]
            .sort((a, b) => a.ordemEntrega - b.ordemEntrega)
            .map((item) => pedidos.find((p) => p.id === item.pedidoId))
            .filter(Boolean)
            .map((pedido) => projetar(pedido.clienteX, pedido.clienteY));
          const caminho = [base, ...pontos, base].map((p) => `${p.cx},${p.cy}`).join(' ');
          return <polyline key={viagem.id} points={caminho} fill="none" stroke={cor} strokeWidth="1.5" opacity="0.7" />;
        })}

        {(() => {
          const { cx, cy } = projetar(0, 0);
          return (
            <rect x={cx - 5} y={cy - 5} width="10" height="10" fill="#111" transform={`rotate(45 ${cx} ${cy})`}>
              <title>Base</title>
            </rect>
          );
        })()}

        {pedidos.map((pedido) => {
          const { cx, cy } = projetar(pedido.clienteX, pedido.clienteY);
          return (
            <circle key={pedido.id} cx={cx} cy={cy} r="5" fill={CORES_PRIORIDADE[pedido.prioridade] ?? '#8f8f96'}>
              <title>
                Pedido ({pedido.clienteX}, {pedido.clienteY}) — {pedido.prioridade} — {pedido.status}
              </title>
            </circle>
          );
        })}
      </svg>

      <div className="legenda">
        <span>
          <i className="ponto" style={{ background: CORES_PRIORIDADE.alta }} /> Prioridade alta
        </span>
        <span>
          <i className="ponto" style={{ background: CORES_PRIORIDADE.media }} /> Prioridade média
        </span>
        <span>
          <i className="ponto" style={{ background: CORES_PRIORIDADE.baixa }} /> Prioridade baixa
        </span>
        <span>
          <i className="ponto" style={{ background: 'rgba(229, 72, 77, 0.3)', border: '1px dashed #e5484d' }} /> Obstáculo
        </span>
        <span>
          <i className="quadrado" /> Base (0,0)
        </span>
      </div>
    </section>
  );
}

export default MapaEntregas;
