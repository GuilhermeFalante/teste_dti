import { useState } from 'react';
import { PROXIMOS_ESTADOS } from '../domain/estadosDrone';
import MensagemErro from './MensagemErro';

const FORM_INICIAL = { nome: '', capacidadeKg: '', alcanceKm: '', velocidadeKmH: '' };

function DronesPanel({ drones, carregando, erro, criarDrone, avancarEstadoDrone }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erroFormulario, setErroFormulario] = useState(null);

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErroFormulario(null);
    try {
      await criarDrone({
        nome: form.nome,
        capacidadeKg: Number(form.capacidadeKg),
        alcanceKm: Number(form.alcanceKm),
        ...(form.velocidadeKmH ? { velocidadeKmH: Number(form.velocidadeKmH) } : {}),
      });
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
        <button type="submit">Cadastrar drone</button>
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
              <LinhaDrone key={drone.id} drone={drone} avancarEstadoDrone={avancarEstadoDrone} />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function LinhaDrone({ drone, avancarEstadoDrone }) {
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

  return (
    <tr>
      <td>{drone.nome}</td>
      <td>{drone.capacidadeKg} kg</td>
      <td>{drone.alcanceKm} km</td>
      <td>{drone.velocidadeKmH} km/h</td>
      <td>{drone.bateriaPercentual.toFixed(1)}%</td>
      <td>{drone.estado}</td>
      <td>
        {proximos.map((proximoEstado) => (
          <button key={proximoEstado} type="button" onClick={() => aoAvancar(proximoEstado)}>
            → {proximoEstado}
          </button>
        ))}
        <MensagemErro mensagem={erroAcao} />
      </td>
    </tr>
  );
}

export default DronesPanel;
