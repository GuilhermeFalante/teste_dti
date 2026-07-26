import { useState } from 'react';
import MensagemErro from './MensagemErro';

const FORM_INICIAL = { nome: '', centroX: '', centroY: '', raioKm: '' };

function ObstaculosPanel({ obstaculos, carregando, erro, criarObstaculo }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erroFormulario, setErroFormulario] = useState(null);

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErroFormulario(null);
    try {
      await criarObstaculo({
        nome: form.nome,
        centroX: Number(form.centroX),
        centroY: Number(form.centroY),
        raioKm: Number(form.raioKm),
      });
      setForm(FORM_INICIAL);
    } catch (erroCapturado) {
      setErroFormulario(erroCapturado.message);
    }
  }

  return (
    <section className="painel">
      <h2>Obstáculos (zonas de exclusão aérea)</h2>

      <form className="formulario" onSubmit={aoEnviar}>
        <input
          placeholder="Nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Centro X"
          value={form.centroX}
          onChange={(e) => setForm({ ...form, centroX: e.target.value })}
          step="0.01"
          required
        />
        <input
          type="number"
          placeholder="Centro Y"
          value={form.centroY}
          onChange={(e) => setForm({ ...form, centroY: e.target.value })}
          step="0.01"
          required
        />
        <input
          type="number"
          placeholder="Raio (km)"
          value={form.raioKm}
          onChange={(e) => setForm({ ...form, raioKm: e.target.value })}
          min="0.01"
          step="0.01"
          required
        />
        <button type="submit">Cadastrar obstáculo</button>
      </form>
      <MensagemErro mensagem={erroFormulario} />

      {carregando && <p>Carregando obstáculos...</p>}
      <MensagemErro mensagem={erro} />

      {!carregando && obstaculos.length === 0 && <p>Nenhum obstáculo cadastrado ainda.</p>}

      {obstaculos.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Centro (X, Y)</th>
              <th>Raio</th>
            </tr>
          </thead>
          <tbody>
            {obstaculos.map((obstaculo) => (
              <tr key={obstaculo.id}>
                <td>{obstaculo.nome}</td>
                <td>
                  ({obstaculo.x}, {obstaculo.y})
                </td>
                <td>{obstaculo.raioKm} km</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default ObstaculosPanel;
