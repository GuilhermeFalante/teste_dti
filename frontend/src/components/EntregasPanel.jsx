import { useState } from 'react';
import { PROXIMOS_ESTADOS } from '../domain/estadosDrone';
import { RESUMO_ESTADO_DRONE, rotular } from '../domain/rotulos';
import MensagemErro from './MensagemErro';
import Badge from './Badge';

function EntregasPanel({ entregas, drones, pedidos, aoAlocar, aoDespachar, avancarEstadoDrone }) {
  const { fila, filaCarregando, filaErro, rotas, rotasCarregando, rotasErro, alocando, resultadoAlocacao, erroAlocacao } =
    entregas;

  const nomeDrone = (droneId) => drones.find((d) => d.id === droneId)?.nome ?? droneId;
  const infoPedido = (pedidoId) => pedidos.find((p) => p.id === pedidoId);
  const dronesIdle = drones.filter((d) => d.estado === 'idle');

  return (
    <section className="painel">
      <h2>Entregas</h2>

      <button type="button" onClick={aoAlocar} disabled={alocando}>
        {alocando ? 'Alocando...' : 'Alocar pedidos pendentes'}
      </button>
      <MensagemErro mensagem={erroAlocacao} />

      {resultadoAlocacao && (
        <div className="resultado-alocacao">
          <p>
            {resultadoAlocacao.viagensCriadas.length} viagem(ns) criada(s), {resultadoAlocacao.naoAlocados.length} pedido(s)
            não alocado(s).
          </p>
          {resultadoAlocacao.naoAlocados.length > 0 && (
            <ul>
              {resultadoAlocacao.naoAlocados.map((item) => (
                <li key={item.pedidoId}>
                  Pedido {item.pedidoId.slice(0, 8)}: {item.motivo}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <DespachoManual dronesIdle={dronesIdle} fila={fila} aoDespachar={aoDespachar} />

      <h3>Fila de entrega (pendentes)</h3>
      {filaCarregando && <p>Carregando fila...</p>}
      <MensagemErro mensagem={filaErro} />
      {!filaCarregando && fila.length === 0 && <p>Nenhum pedido pendente.</p>}
      {fila.length > 0 && (
        <ol>
          {fila.map((pedido) => (
            <li key={pedido.id}>
              <Badge categoria="prioridade" valor={pedido.prioridade} /> ({pedido.clienteX}, {pedido.clienteY}),{' '}
              {pedido.pesoKg}kg
            </li>
          ))}
        </ol>
      )}

      <h3>Viagens</h3>
      {rotasCarregando && <p>Carregando viagens...</p>}
      <MensagemErro mensagem={rotasErro} />
      {!rotasCarregando && rotas.length === 0 && <p>Nenhuma viagem criada ainda.</p>}
      {rotas.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Drone</th>
              <th>Status viagem</th>
              <th>Estado drone</th>
              <th>Distância</th>
              <th>Tempo estimado</th>
              <th>Pedidos (ordem de entrega)</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {rotas.map((viagem) => (
              <LinhaViagem
                key={viagem.id}
                viagem={viagem}
                drone={drones.find((d) => d.id === viagem.droneId)}
                nomeDrone={nomeDrone(viagem.droneId)}
                infoPedido={infoPedido}
                avancarEstadoDrone={avancarEstadoDrone}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function LinhaViagem({ viagem, drone, nomeDrone, infoPedido, avancarEstadoDrone }) {
  const [erroAcao, setErroAcao] = useState(null);
  const tempoEstimadoHoras = drone ? viagem.distanciaTotalKm / drone.velocidadeKmH : null;
  const proximosEstados = drone ? PROXIMOS_ESTADOS[drone.estado] ?? [] : [];

  async function aoAvancar(proximoEstado) {
    setErroAcao(null);
    try {
      await avancarEstadoDrone(viagem.droneId, proximoEstado);
    } catch (erroCapturado) {
      setErroAcao(erroCapturado.message);
    }
  }

  return (
    <tr>
      <td>{nomeDrone}</td>
      <td>
        <Badge categoria="statusViagem" valor={viagem.status} />
      </td>
      <td>{drone ? <Badge categoria="estadoDrone" valor={drone.estado} /> : '—'}</td>
      <td>{viagem.distanciaTotalKm?.toFixed(2)} km</td>
      <td>{tempoEstimadoHoras !== null ? `${(tempoEstimadoHoras * 60).toFixed(0)} min` : '—'}</td>
      <td>
        {[...viagem.pedidos]
          .sort((a, b) => a.ordemEntrega - b.ordemEntrega)
          .map((item) => {
            const pedido = infoPedido(item.pedidoId);
            return pedido ? `(${pedido.clienteX}, ${pedido.clienteY})` : item.pedidoId.slice(0, 8);
          })
          .join(' → ')}
      </td>
      <td>
        <div className="acoes">
          {viagem.status === 'em_andamento' &&
            proximosEstados.map((proximoEstado) => (
              <button key={proximoEstado} type="button" onClick={() => aoAvancar(proximoEstado)}>
                → {rotular(RESUMO_ESTADO_DRONE, proximoEstado)}
              </button>
            ))}
        </div>
        <MensagemErro mensagem={erroAcao} />
      </td>
    </tr>
  );
}

function DespachoManual({ dronesIdle, fila, aoDespachar }) {
  const [droneId, setDroneId] = useState('');
  const [pedidoIds, setPedidoIds] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  const pedidosPendentes = fila;
  const droneSelecionado = dronesIdle.find((d) => d.id === droneId);
  const pesoSelecionado = pedidosPendentes
    .filter((p) => pedidoIds.includes(p.id))
    .reduce((soma, p) => soma + p.pesoKg, 0);

  function alternarPedido(id) {
    setPedidoIds((atual) => (atual.includes(id) ? atual.filter((p) => p !== id) : [...atual, id]));
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await aoDespachar({ droneId, pedidoIds });
      setDroneId('');
      setPedidoIds([]);
    } catch (erroCapturado) {
      setErro(erroCapturado.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="despacho-manual">
      <h3>Despacho manual</h3>
      <p>Escolha o drone e os pedidos que ele vai entregar, em vez de rodar a alocação automática.</p>

      {dronesIdle.length === 0 && <p>Nenhum drone disponível no momento.</p>}
      {pedidosPendentes.length === 0 && <p>Nenhum pedido pendente para despachar.</p>}

      {dronesIdle.length > 0 && pedidosPendentes.length > 0 && (
        <form className="formulario" onSubmit={aoEnviar}>
          <select value={droneId} onChange={(e) => setDroneId(e.target.value)} required>
            <option value="" disabled>
              Selecione um drone
            </option>
            {dronesIdle.map((drone) => (
              <option key={drone.id} value={drone.id}>
                {drone.nome} (cap. {drone.capacidadeKg}kg, alcance {drone.alcanceKm}km, bateria{' '}
                {drone.bateriaPercentual.toFixed(0)}%)
              </option>
            ))}
          </select>

          <fieldset className="lista-pedidos">
            <legend>
              Pedidos {droneSelecionado && `(peso selecionado: ${pesoSelecionado}kg / ${droneSelecionado.capacidadeKg}kg)`}
            </legend>
            {pedidosPendentes.map((pedido) => (
              <label key={pedido.id} className="opcao-pedido">
                <input
                  type="checkbox"
                  checked={pedidoIds.includes(pedido.id)}
                  onChange={() => alternarPedido(pedido.id)}
                />
                <Badge categoria="prioridade" valor={pedido.prioridade} /> ({pedido.clienteX}, {pedido.clienteY}),{' '}
                {pedido.pesoKg}kg
              </label>
            ))}
          </fieldset>

          <button type="submit" disabled={enviando || !droneId || pedidoIds.length === 0}>
            {enviando ? 'Despachando...' : 'Despachar'}
          </button>
        </form>
      )}
      <MensagemErro mensagem={erro} />
    </div>
  );
}

export default EntregasPanel;
