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
  };
}

module.exports = { criarObstaculoRepository };
