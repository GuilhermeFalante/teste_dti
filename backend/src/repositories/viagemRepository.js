const { viagemDoRegistro } = require('./mapeadores');

function criarViagemRepository(supabase) {
  return {
    async criar({ droneId, pedidoIds, distanciaTotalKm }) {
      const { data: viagem, error: erroViagem } = await supabase
        .from('viagens')
        .insert({ drone_id: droneId, distancia_total_km: distanciaTotalKm })
        .select()
        .single();
      if (erroViagem) throw erroViagem;

      const itens = pedidoIds.map((pedidoId, indice) => ({
        viagem_id: viagem.id,
        pedido_id: pedidoId,
        ordem_entrega: indice + 1,
      }));
      const { error: erroItens } = await supabase.from('viagem_pedidos').insert(itens);
      if (erroItens) throw erroItens;

      return viagemDoRegistro(viagem);
    },

    async listarTodas() {
      const { data, error } = await supabase.from('viagens').select('*').order('iniciada_em');
      if (error) throw error;
      return data.map(viagemDoRegistro);
    },

    async listarPorDrone(droneId) {
      const { data, error } = await supabase.from('viagens').select('*').eq('drone_id', droneId);
      if (error) throw error;
      return data.map(viagemDoRegistro);
    },

    async buscarViagemAtivaPorDrone(droneId) {
      const { data, error } = await supabase
        .from('viagens')
        .select('*')
        .eq('drone_id', droneId)
        .eq('status', 'em_andamento')
        .order('iniciada_em', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? viagemDoRegistro(data) : null;
    },

    async buscarPedidosDaViagem(viagemId) {
      const { data, error } = await supabase
        .from('viagem_pedidos')
        .select('pedido_id, ordem_entrega')
        .eq('viagem_id', viagemId)
        .order('ordem_entrega');
      if (error) throw error;
      return data.map((item) => ({ pedidoId: item.pedido_id, ordemEntrega: item.ordem_entrega }));
    },

    async finalizar(id) {
      const { data, error } = await supabase
        .from('viagens')
        .update({ status: 'concluida', finalizada_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return viagemDoRegistro(data);
    },
  };
}

module.exports = { criarViagemRepository };
