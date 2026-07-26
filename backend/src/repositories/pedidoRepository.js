const { pedidoDoRegistro } = require('./mapeadores');

function criarPedidoRepository(supabase) {
  return {
    async criar({ clienteX, clienteY, pesoKg, prioridade }) {
      const { data, error } = await supabase
        .from('pedidos')
        .insert({ cliente_x: clienteX, cliente_y: clienteY, peso_kg: pesoKg, prioridade })
        .select()
        .single();

      if (error) throw error;
      return pedidoDoRegistro(data);
    },

    async listarTodos() {
      const { data, error } = await supabase.from('pedidos').select('*').order('criado_em');
      if (error) throw error;
      return data.map(pedidoDoRegistro);
    },

    async listarPendentes() {
      const { data, error } = await supabase.from('pedidos').select('*').eq('status', 'pendente').order('criado_em');
      if (error) throw error;
      return data.map(pedidoDoRegistro);
    },

    async buscarPorId(id) {
      const { data, error } = await supabase.from('pedidos').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? pedidoDoRegistro(data) : null;
    },

    async atualizarStatus(id, status) {
      const { data, error } = await supabase.from('pedidos').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return pedidoDoRegistro(data);
    },

    async remover(id) {
      const { error } = await supabase.from('pedidos').delete().eq('id', id);
      if (error) throw error;
    },
  };
}

module.exports = { criarPedidoRepository };
