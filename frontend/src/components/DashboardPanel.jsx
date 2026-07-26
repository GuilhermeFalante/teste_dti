import MensagemErro from './MensagemErro';
import MapaEntregas from './MapaEntregas';

function DashboardPanel({ relatorio, carregando, erro, pedidos, obstaculos, rotas, drones }) {
  return (
    <>
      <section className="painel">
        <h2>Relatório</h2>

        {carregando && <p>Carregando relatório...</p>}
        <MensagemErro mensagem={erro} />

        {relatorio && (
          <div className="cartoes-relatorio">
            <div className="cartao">
              <span className="cartao-valor">{relatorio.entregasRealizadas}</span>
              <span className="cartao-rotulo">Entregas realizadas</span>
            </div>

            <div className="cartao">
              <span className="cartao-valor">
                {relatorio.tempoMedioHoras !== null ? `${(relatorio.tempoMedioHoras * 60).toFixed(1)} min` : '—'}
              </span>
              <span className="cartao-rotulo">Tempo médio por entrega</span>
            </div>

            <div className="cartao">
              <span className="cartao-valor">{relatorio.droneMaisEficiente?.nome ?? '—'}</span>
              <span className="cartao-rotulo">
                Drone mais eficiente
                {relatorio.droneMaisEficiente && (
                  <>
                    {' '}
                    ({relatorio.droneMaisEficiente.pedidosEntregues} pedidos em{' '}
                    {relatorio.droneMaisEficiente.distanciaTotalKm.toFixed(1)} km)
                  </>
                )}
              </span>
            </div>
          </div>
        )}
      </section>

      <MapaEntregas pedidos={pedidos} obstaculos={obstaculos} rotas={rotas} drones={drones} />
    </>
  );
}

export default DashboardPanel;
