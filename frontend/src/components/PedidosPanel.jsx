import { useState } from 'react';
import MensagemErro from './MensagemErro';

const FORM_INICIAL = { clienteX: '', clienteY: '', pesoKg: '', prioridade: 'media' };

function PedidosPanel({ pedidos, carregando, erro, criarPedido, removerPedido }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erroFormulario, setErroFormulario] = useState(null);

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErroFormulario(null);
    try {
      await criarPedido({
        clienteX: Number(form.clienteX),
        clienteY: Number(form.clienteY),
        pesoKg: Number(form.pesoKg),
        prioridade: form.prioridade,
      });
      setForm(FORM_INICIAL);
    } catch (erroCapturado) {
      setErroFormulario(erroCapturado.message);
    }
  }

  return (
    <section className="painel">
      <h2>Pedidos</h2>

      <form className="formulario" onSubmit={aoEnviar}>
        <input
          type="number"
          placeholder="Coordenada X do cliente"
          value={form.clienteX}
          onChange={(e) => setForm({ ...form, clienteX: e.target.value })}
          step="0.01"
          required
        />
        <input
          type="number"
          placeholder="Coordenada Y do cliente"
          value={form.clienteY}
          onChange={(e) => setForm({ ...form, clienteY: e.target.value })}
          step="0.01"
          required
        />
        <input
          type="number"
          placeholder="Peso (kg)"
          value={form.pesoKg}
          onChange={(e) => setForm({ ...form, pesoKg: e.target.value })}
          min="0.01"
          step="0.01"
          required
        />
        <select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <button type="submit">Criar pedido</button>
      </form>
      <MensagemErro mensagem={erroFormulario} />

      {carregando && <p>Carregando pedidos...</p>}
      <MensagemErro mensagem={erro} />

      {!carregando && pedidos.length === 0 && <p>Nenhum pedido cadastrado ainda.</p>}

      {pedidos.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Cliente (X, Y)</th>
              <th>Peso</th>
              <th>Prioridade</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <LinhaPedido key={pedido.id} pedido={pedido} removerPedido={removerPedido} />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function LinhaPedido({ pedido, removerPedido }) {
  const [erroAcao, setErroAcao] = useState(null);
  const podeRemover = pedido.status === 'pendente';

  async function aoRemover() {
    if (!window.confirm(`Remover o pedido de (${pedido.clienteX}, ${pedido.clienteY})?`)) return;
    setErroAcao(null);
    try {
      await removerPedido(pedido.id);
    } catch (erroCapturado) {
      setErroAcao(erroCapturado.message);
    }
  }

  return (
    <tr>
      <td>
        ({pedido.clienteX}, {pedido.clienteY})
      </td>
      <td>{pedido.pesoKg} kg</td>
      <td>{pedido.prioridade}</td>
      <td>{pedido.status}</td>
      <td>
        {podeRemover ? (
          <button type="button" className="botao-remover" onClick={aoRemover}>
            🗑️ Remover
          </button>
        ) : (
          <span title='Só pedidos "pendente" podem ser removidos'>—</span>
        )}
        <MensagemErro mensagem={erroAcao} />
      </td>
    </tr>
  );
}

export default PedidosPanel;
