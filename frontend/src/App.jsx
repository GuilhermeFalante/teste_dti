import { useEffect, useState } from 'react';
import useDrones from './hooks/useDrones';
import usePedidos from './hooks/usePedidos';
import useObstaculos from './hooks/useObstaculos';
import useEntregas from './hooks/useEntregas';
import useRelatorio from './hooks/useRelatorio';
import DronesPanel from './components/DronesPanel';
import PedidosPanel from './components/PedidosPanel';
import ObstaculosPanel from './components/ObstaculosPanel';
import EntregasPanel from './components/EntregasPanel';
import MapaEntregas from './components/MapaEntregas';
import DashboardPanel from './components/DashboardPanel';
import './App.css';

const ABAS = [
  { chave: 'dashboard', titulo: 'Dashboard', icone: '📊' },
  { chave: 'mapa', titulo: 'Mapa', icone: '🗺️' },
  { chave: 'entregas', titulo: 'Entregas', icone: '📦' },
  { chave: 'drones', titulo: 'Drones', icone: '🚁' },
  { chave: 'pedidos', titulo: 'Pedidos', icone: '🧾' },
  { chave: 'obstaculos', titulo: 'Obstáculos', icone: '🚧' },
];

function App() {
  const [abaAtiva, setAbaAtiva] = useState('dashboard');

  const drones = useDrones();
  const pedidos = usePedidos();
  const obstaculos = useObstaculos();
  const entregas = useEntregas();
  const relatorio = useRelatorio();

  const { recarregar: recarregarDrones } = drones;
  const { recarregar: recarregarPedidos } = pedidos;
  const { recarregarTudo: recarregarEntregas } = entregas;
  const { recarregar: recarregarRelatorio } = relatorio;

  async function aoAlocar() {
    await entregas.alocar();
    await Promise.all([drones.recarregar(), pedidos.recarregar(), recarregarRelatorio({ silencioso: true })]);
  }

  async function aoDespachar(dados) {
    await entregas.despachar(dados);
    setAbaAtiva('mapa');
    await Promise.all([drones.recarregar(), pedidos.recarregar(), recarregarRelatorio({ silencioso: true })]);
  }

  // Avançar o estado do drone também pode mudar o status dos pedidos da viagem dele
  // (em_rota, entregue) e finalizar a viagem no backend — recarrega tudo para refletir isso.
  async function aoAvancarEstadoDrone(droneId, estado) {
    await drones.avancarEstadoDrone(droneId, estado);
    await Promise.all([pedidos.recarregar(), entregas.recarregarTudo(), recarregarRelatorio({ silencioso: true })]);
  }

  // A fila de entrega usada no despacho manual vem de um endpoint próprio (entregas.fila), não
  // de pedidos.pedidos — sem isso, um pedido recém-criado/removido não aparecia como opção pra
  // despachar até alguma outra ação (alocar, despachar, avançar estado) recarregar a fila.
  async function aoCriarPedido(dados) {
    await pedidos.criarPedido(dados);
    await entregas.recarregarTudo();
  }

  async function aoRemoverPedido(id) {
    await pedidos.removerPedido(id);
    await entregas.recarregarTudo();
  }

  // O ciclo idle→carregando→em_voo→entregando→retornando→idle avança sozinho no backend
  // (backend/src/services/simulacaoVooService.js), e pode ter sido disparado por qualquer
  // origem (esta aba, outra aba, outra pessoa) — por isso o polling roda sempre, incondicional:
  // uma checagem que só recarrega "se já souber que tem drone em movimento" nunca percebe
  // mudanças que aconteceram fora desta tela, porque depende do próprio dado desatualizado
  // pra decidir se busca dado novo.
  useEffect(() => {
    const intervalo = setInterval(() => {
      recarregarDrones({ silencioso: true });
      recarregarPedidos({ silencioso: true });
      recarregarEntregas({ silencioso: true });
      recarregarRelatorio({ silencioso: true });
    }, 2000);

    return () => clearInterval(intervalo);
  }, [recarregarDrones, recarregarPedidos, recarregarEntregas, recarregarRelatorio]);

  return (
    <div className="app">
      <aside className="barra-lateral">
        <div className="marca">
          <span className="marca-icone">🚁</span>
          <span className="marca-texto">Simulador de Drones</span>
        </div>
        <nav>
          {ABAS.map((aba) => (
            <button
              key={aba.chave}
              type="button"
              className={aba.chave === abaAtiva ? 'ativa' : ''}
              onClick={() => setAbaAtiva(aba.chave)}
            >
              <span className="nav-icone">{aba.icone}</span>
              {aba.titulo}
            </button>
          ))}
        </nav>
      </aside>

      <main className="conteudo">
        {abaAtiva === 'dashboard' && (
          <DashboardPanel
            relatorio={relatorio.relatorio}
            carregando={relatorio.carregando}
            erro={relatorio.erro}
            pedidos={pedidos.pedidos}
            obstaculos={obstaculos.obstaculos}
            rotas={entregas.rotas}
            drones={drones.drones}
          />
        )}
        {abaAtiva === 'mapa' && (
          <MapaEntregas
            pedidos={pedidos.pedidos}
            obstaculos={obstaculos.obstaculos}
            rotas={entregas.rotas}
            drones={drones.drones}
          />
        )}
        {abaAtiva === 'entregas' && (
          <EntregasPanel
            entregas={entregas}
            drones={drones.drones}
            pedidos={pedidos.pedidos}
            aoAlocar={aoAlocar}
            aoDespachar={aoDespachar}
            avancarEstadoDrone={aoAvancarEstadoDrone}
          />
        )}
        {abaAtiva === 'drones' && (
          <DronesPanel
            drones={drones.drones}
            carregando={drones.carregando}
            erro={drones.erro}
            criarDrone={drones.criarDrone}
            atualizarDrone={drones.atualizarDrone}
            removerDrone={drones.removerDrone}
            avancarEstadoDrone={aoAvancarEstadoDrone}
          />
        )}
        {abaAtiva === 'pedidos' && (
          <PedidosPanel
            pedidos={pedidos.pedidos}
            carregando={pedidos.carregando}
            erro={pedidos.erro}
            criarPedido={aoCriarPedido}
            removerPedido={aoRemoverPedido}
          />
        )}
        {abaAtiva === 'obstaculos' && (
          <ObstaculosPanel
            obstaculos={obstaculos.obstaculos}
            carregando={obstaculos.carregando}
            erro={obstaculos.erro}
            criarObstaculo={obstaculos.criarObstaculo}
            atualizarObstaculo={obstaculos.atualizarObstaculo}
            removerObstaculo={obstaculos.removerObstaculo}
          />
        )}
      </main>
    </div>
  );
}

export default App;
