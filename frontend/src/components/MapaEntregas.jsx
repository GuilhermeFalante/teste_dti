import { useMemo } from 'react';

const LARGURA = 640;
const ALTURA = 480;
const PADDING = 24;
const DURACAO_VOO = '3s';

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

function pontosParaCaminhoSvg(pontos) {
  return pontos.map((ponto, indice) => `${indice === 0 ? 'M' : 'L'} ${ponto.cx} ${ponto.cy}`).join(' ');
}

// Pontos (já projetados em pixels) da rota de ida de uma viagem: base -> paradas na ordem de
// entrega. A rota de volta é a mesma linha, percorrida ao contrário.
function calcularPontosDaViagem(viagem, pedidos, projetar) {
  const paradas = [...viagem.pedidos]
    .sort((a, b) => a.ordemEntrega - b.ordemEntrega)
    .map((item) => pedidos.find((p) => p.id === item.pedidoId))
    .filter(Boolean)
    .map((pedido) => projetar(pedido.clienteX, pedido.clienteY));

  if (paradas.length === 0) return null;

  const pontosIda = [projetar(0, 0), ...paradas];
  return { pontosIda, pontosVolta: [...pontosIda].reverse() };
}

// Viagem mais recente do drone (qualquer status): ao entrar em "retornando" o backend já marca a
// viagem como "concluida", então não dá pra filtrar só por "em_andamento" — precisamos dela ainda
// pra saber por onde o drone deve voltar.
function viagemMaisRecenteDoDrone(rotas, droneId) {
  return [...rotas]
    .filter((viagem) => viagem.droneId === droneId)
    .sort((a, b) => new Date(b.iniciadaEm) - new Date(a.iniciadaEm))[0];
}

function IconeDrone({ drone, rotas, pedidos, projetar, indice }) {
  const viagem = drone.estado === 'idle' ? null : viagemMaisRecenteDoDrone(rotas, drone.id);
  const pontosViagem = viagem ? calcularPontosDaViagem(viagem, pedidos, projetar) : null;

  const titulo = (
    <title>
      {drone.nome} — {drone.estado}
    </title>
  );

  // Voando: anima ao longo da linha traçada (base -> paradas), na ordem de entrega.
  if (pontosViagem && drone.estado === 'em_voo') {
    const caminho = pontosParaCaminhoSvg(pontosViagem.pontosIda);
    return (
      <text fontSize="22" textAnchor="middle" dominantBaseline="middle">
        🚁
        <animateMotion dur={DURACAO_VOO} repeatCount="1" fill="freeze" path={caminho} />
        {titulo}
      </text>
    );
  }

  // Retornando: anima pela mesma linha, no sentido contrário, até a base.
  if (pontosViagem && drone.estado === 'retornando') {
    const caminho = pontosParaCaminhoSvg(pontosViagem.pontosVolta);
    return (
      <text fontSize="22" textAnchor="middle" dominantBaseline="middle">
        🚁
        <animateMotion dur={DURACAO_VOO} repeatCount="1" fill="freeze" path={caminho} />
        {titulo}
      </text>
    );
  }

  // Parado: entregando fica na última parada; idle/carregando ficam na base (idle sem viagem
  // ganha um pequeno espalhamento ao redor da base, pra vários drones parados não empilharem).
  let ponto;
  if (drone.estado === 'entregando' && pontosViagem) {
    ponto = pontosViagem.pontosIda[pontosViagem.pontosIda.length - 1];
  } else if (!pontosViagem) {
    const base = projetar(0, 0);
    const angulo = (indice * 47 * Math.PI) / 180;
    const raio = 14;
    ponto = { cx: base.cx + raio * Math.cos(angulo), cy: base.cy + raio * Math.sin(angulo) };
  } else {
    ponto = projetar(0, 0);
  }

  return (
    <text
      className="icone-drone"
      fontSize="22"
      textAnchor="middle"
      dominantBaseline="middle"
      style={{ transform: `translate(${ponto.cx}px, ${ponto.cy}px)` }}
    >
      🚁
      {titulo}
    </text>
  );
}

function MapaEntregas({ pedidos, obstaculos, rotas, drones }) {
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

        {drones.map((drone, indice) => (
          // A key inclui o estado de propósito: quando o drone muda de estado (ex.: entregando ->
          // retornando), React desmonta e remonta o ícone, o que reinicia o <animateMotion> do zero
          // (só trocar o atributo "path" de um elemento já existente não reinicia a animação SMIL).
          <IconeDrone
            key={`${drone.id}-${drone.estado}`}
            drone={drone}
            rotas={rotas}
            pedidos={pedidos}
            projetar={projetar}
            indice={indice}
          />
        ))}
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
        <span>🚁 Drone (voa pela linha traçada até o destino e volta)</span>
      </div>
    </section>
  );
}

export default MapaEntregas;
