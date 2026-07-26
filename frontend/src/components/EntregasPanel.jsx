import MensagemErro from './MensagemErro';

function EntregasPanel({ entregas, drones, pedidos, aoAlocar }) {
  const { fila, filaCarregando, filaErro, rotas, rotasCarregando, rotasErro, alocando, resultadoAlocacao, erroAlocacao } =
    entregas;

  const nomeDrone = (droneId) => drones.find((d) => d.id === droneId)?.nome ?? droneId;
  const infoPedido = (pedidoId) => pedidos.find((p) => p.id === pedidoId);

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

      <h3>Fila de entrega (pendentes)</h3>
      {filaCarregando && <p>Carregando fila...</p>}
      <MensagemErro mensagem={filaErro} />
      {!filaCarregando && fila.length === 0 && <p>Nenhum pedido pendente.</p>}
      {fila.length > 0 && (
        <ol>
          {fila.map((pedido) => (
            <li key={pedido.id}>
              {pedido.prioridade} — ({pedido.clienteX}, {pedido.clienteY}), {pedido.pesoKg}kg
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
              <th>Status</th>
              <th>Distância</th>
              <th>Tempo estimado</th>
              <th>Pedidos (ordem de entrega)</th>
            </tr>
          </thead>
          <tbody>
            {rotas.map((viagem) => {
              const drone = drones.find((d) => d.id === viagem.droneId);
              const tempoEstimadoHoras = drone ? viagem.distanciaTotalKm / drone.velocidadeKmH : null;
              return (
                <tr key={viagem.id}>
                  <td>{nomeDrone(viagem.droneId)}</td>
                  <td>{viagem.status}</td>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default EntregasPanel;
