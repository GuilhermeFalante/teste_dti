import { useState } from 'react';
import useDrones from './hooks/useDrones';
import usePedidos from './hooks/usePedidos';
import useObstaculos from './hooks/useObstaculos';
import useEntregas from './hooks/useEntregas';
import DronesPanel from './components/DronesPanel';
import PedidosPanel from './components/PedidosPanel';
import ObstaculosPanel from './components/ObstaculosPanel';
import EntregasPanel from './components/EntregasPanel';
import MapaEntregas from './components/MapaEntregas';
import './App.css';

const ABAS = [
  { chave: 'mapa', titulo: 'Mapa' },
  { chave: 'entregas', titulo: 'Entregas' },
  { chave: 'drones', titulo: 'Drones' },
  { chave: 'pedidos', titulo: 'Pedidos' },
  { chave: 'obstaculos', titulo: 'Obstáculos' },
];

function App() {
  const [abaAtiva, setAbaAtiva] = useState('mapa');

  const drones = useDrones();
  const pedidos = usePedidos();
  const obstaculos = useObstaculos();
  const entregas = useEntregas();

  async function aoAlocar() {
    await entregas.alocar();
    await Promise.all([drones.recarregar(), pedidos.recarregar()]);
  }

  return (
    <div className="app">
      <header>
        <h1>Simulador de Encomendas em Drone</h1>
        <nav>
          {ABAS.map((aba) => (
            <button
              key={aba.chave}
              type="button"
              className={aba.chave === abaAtiva ? 'ativa' : ''}
              onClick={() => setAbaAtiva(aba.chave)}
            >
              {aba.titulo}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {abaAtiva === 'mapa' && (
          <MapaEntregas pedidos={pedidos.pedidos} obstaculos={obstaculos.obstaculos} rotas={entregas.rotas} />
        )}
        {abaAtiva === 'entregas' && (
          <EntregasPanel entregas={entregas} drones={drones.drones} pedidos={pedidos.pedidos} aoAlocar={aoAlocar} />
        )}
        {abaAtiva === 'drones' && (
          <DronesPanel
            drones={drones.drones}
            carregando={drones.carregando}
            erro={drones.erro}
            criarDrone={drones.criarDrone}
            avancarEstadoDrone={drones.avancarEstadoDrone}
          />
        )}
        {abaAtiva === 'pedidos' && (
          <PedidosPanel
            pedidos={pedidos.pedidos}
            carregando={pedidos.carregando}
            erro={pedidos.erro}
            criarPedido={pedidos.criarPedido}
          />
        )}
        {abaAtiva === 'obstaculos' && (
          <ObstaculosPanel
            obstaculos={obstaculos.obstaculos}
            carregando={obstaculos.carregando}
            erro={obstaculos.erro}
            criarObstaculo={obstaculos.criarObstaculo}
          />
        )}
      </main>
    </div>
  );
}

export default App;
