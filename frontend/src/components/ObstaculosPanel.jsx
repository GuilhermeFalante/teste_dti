import { useState } from 'react';
import MensagemErro from './MensagemErro';

const FORM_INICIAL = { nome: '', centroX: '', centroY: '', raioKm: '' };

function ObstaculosPanel({ obstaculos, carregando, erro, criarObstaculo, atualizarObstaculo, removerObstaculo }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [erroFormulario, setErroFormulario] = useState(null);

  function aoEditar(obstaculo) {
    setEditandoId(obstaculo.id);
    setForm({
      nome: obstaculo.nome,
      centroX: String(obstaculo.x),
      centroY: String(obstaculo.y),
      raioKm: String(obstaculo.raioKm),
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
      centroX: Number(form.centroX),
      centroY: Number(form.centroY),
      raioKm: Number(form.raioKm),
    };

    try {
      if (editandoId) {
        await atualizarObstaculo(editandoId, dados);
      } else {
        await criarObstaculo(dados);
      }
      setEditandoId(null);
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
        <button type="submit">{editandoId ? 'Salvar alterações' : 'Cadastrar obstáculo'}</button>
        {editandoId && (
          <button type="button" onClick={cancelarEdicao}>
            Cancelar
          </button>
        )}
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
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {obstaculos.map((obstaculo) => (
              <LinhaObstaculo
                key={obstaculo.id}
                obstaculo={obstaculo}
                aoEditar={aoEditar}
                removerObstaculo={removerObstaculo}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function LinhaObstaculo({ obstaculo, aoEditar, removerObstaculo }) {
  const [erroAcao, setErroAcao] = useState(null);

  async function aoRemover() {
    if (!window.confirm(`Remover o obstáculo "${obstaculo.nome}"?`)) return;
    setErroAcao(null);
    try {
      await removerObstaculo(obstaculo.id);
    } catch (erroCapturado) {
      setErroAcao(erroCapturado.message);
    }
  }

  return (
    <tr>
      <td>{obstaculo.nome}</td>
      <td>
        ({obstaculo.x}, {obstaculo.y})
      </td>
      <td>{obstaculo.raioKm} km</td>
      <td>
        <div className="acoes">
          <button type="button" className="botao-editar" onClick={() => aoEditar(obstaculo)}>
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

export default ObstaculosPanel;
