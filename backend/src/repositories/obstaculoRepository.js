const { obstaculoDoRegistro } = require('./mapeadores');

function criarObstaculoRepository(supabase) {
  return {
    async criar({ nome, centroX, centroY, raioKm }) {
      const { data, error } = await supabase
        .from('obstaculos')
        .insert({ nome, centro_x: centroX, centro_y: centroY, raio_km: raioKm })
        .select()
        .single();

      if (error) throw error;
      return obstaculoDoRegistro(data);
    },

    async listarTodos() {
      const { data, error } = await supabase.from('obstaculos').select('*').order('criado_em');
      if (error) throw error;
      return data.map(obstaculoDoRegistro);
    },

    async buscarPorId(id) {
      const { data, error } = await supabase.from('obstaculos').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? obstaculoDoRegistro(data) : null;
    },

    async atualizar(id, { nome, centroX, centroY, raioKm }) {
      const { data, error } = await supabase
        .from('obstaculos')
        .update({ nome, centro_x: centroX, centro_y: centroY, raio_km: raioKm })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return obstaculoDoRegistro(data);
    },

    async remover(id) {
      const { error } = await supabase.from('obstaculos').delete().eq('id', id);
      if (error) throw error;
    },
  };
}

module.exports = { criarObstaculoRepository };
