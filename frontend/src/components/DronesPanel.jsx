import { useState } from 'react';
import { PROXIMOS_ESTADOS } from '../domain/estadosDrone';
import MensagemErro from './MensagemErro';

const FORM_INICIAL = { nome: '', capacidadeKg: '', alcanceKm: '', velocidadeKmH: '' };

function DronesPanel({ drones, carregando, erro, criarDrone, atualizarDrone, removerDrone, avancarEstadoDrone }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [erroFormulario, setErroFormulario] = useState(null);

  function aoEditar(drone) {
    setEditandoId(drone.id);
    setForm({
      nome: drone.nome,
      capacidadeKg: String(drone.capacidadeKg),
      alcanceKm: String(drone.alcanceKm),
      velocidadeKmH: String(drone.velocidadeKmH),
    });
    setErroFormulario(null);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setErroFormulario(null);
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErroFormulario(null);
    const dados = {
      nome: form.nome,
      capacidadeKg: Number(form.capacidadeKg),
      alcanceKm: Number(form.alcanceKm),
      ...(form.velocidadeKmH ? { velocidadeKmH: Number(form.velocidadeKmH) } : {}),
    };

    try {
      if (editandoId) {
        await atualizarDrone(editandoId, dados);
      } else {
        await criarDrone(dados);
      }
      setEditandoId(null);
      setForm(FORM_INICIAL);
    } catch (erroCapturado) {
      setErroFormulario(erroCapturado.message);
    }
  }

  return (
    <section className="painel">
      <h2>Drones</h2>

      <form className="formulario" onSubmit={aoEnviar}>
        <input
          placeholder="Nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Capacidade (kg)"
          value={form.capacidadeKg}
          onChange={(e) => setForm({ ...form, capacidadeKg: e.target.value })}
          min="0.01"
          step="0.01"
          required
        />
        <input
          type="number"
          placeholder="Alcance (km)"
          value={form.alcanceKm}
          onChange={(e) => setForm({ ...form, alcanceKm: e.target.value })}
          min="0.01"
          step="0.01"
          required
        />
        <input
          type="number"
          placeholder="Velocidade (km/h, padrão 40)"
          value={form.velocidadeKmH}
          onChange={(e) => setForm({ ...form, velocidadeKmH: e.target.value })}
          min="0.01"
          step="0.01"
        />
        <button type="submit">{editandoId ? 'Salvar alterações' : 'Cadastrar drone'}</button>
        {editandoId && (
          <button type="button" onClick={cancelarEdicao}>
            Cancelar
          </button>
        )}
      </form>
      <MensagemErro mensagem={erroFormulario} />

      {carregando && <p>Carregando drones...</p>}
      <MensagemErro mensagem={erro} />

      {!carregando && drones.length === 0 && <p>Nenhum drone cadastrado ainda.</p>}

      {drones.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Capacidade</th>
              <th>Alcance</th>
              <th>Velocidade</th>
              <th>Bateria</th>
              <th>Estado</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {drones.map((drone) => (
              <LinhaDrone
                key={drone.id}
                drone={drone}
                avancarEstadoDrone={avancarEstadoDrone}
                removerDrone={removerDrone}
                aoEditar={aoEditar}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function LinhaDrone({ drone, avancarEstadoDrone, removerDrone, aoEditar }) {
  const proximos = PROXIMOS_ESTADOS[drone.estado] ?? [];
  const [erroAcao, setErroAcao] = useState(null);

  async function aoAvancar(proximoEstado) {
    setErroAcao(null);
    try {
      await avancarEstadoDrone(drone.id, proximoEstado);
    } catch (erroCapturado) {
      setErroAcao(erroCapturado.message);
    }
  }

  async function aoRemover() {
    const confirmado = window.confirm(
      `Remover o drone "${drone.nome}"?\n\nIsso vai apagar também todas as viagens dele. Os pedidos que estavam nessas viagens voltam para a fila de pendentes, para serem realocados em outro drone.`,
    );
    if (!confirmado) return;

    setErroAcao(null);
    try {
      await removerDrone(drone.id);
    } catch (erroCapturado) {
      setErroAcao(erroCapturado.message);
    }
  }

  return (
    <tr>
      <td>{drone.nome}</td>
      <td>{drone.capacidadeKg} kg</td>
      <td>{drone.alcanceKm} km</td>
      <td>{drone.velocidadeKmH} km/h</td>
      <td>{drone.bateriaPercentual.toFixed(1)}%</td>
      <td>{drone.estado}</td>
      <td>
        <div className="acoes">
          {proximos.map((proximoEstado) => (
            <button key={proximoEstado} type="button" onClick={() => aoAvancar(proximoEstado)}>
              → {proximoEstado}
            </button>
          ))}
          <button type="button" className="botao-editar" onClick={() => aoEditar(drone)}>
            ✏️ Editar
          </button>
          <button type="button" className="botao-remover" onClick={aoRemover}>
            🗑️ Remover
          </button>
        </div>
        <MensagemErro mensagem={erroAcao} />
      </td>
    </tr>
  );
}

export default DronesPanel;
