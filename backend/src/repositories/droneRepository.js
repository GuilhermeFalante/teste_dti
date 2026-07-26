const { droneDoRegistro } = require('./mapeadores');

function criarDroneRepository(supabase) {
  return {
    async criar({ nome, capacidadeKg, alcanceKm }) {
      const { data, error } = await supabase
        .from('drones')
        .insert({ nome, capacidade_kg: capacidadeKg, alcance_km: alcanceKm })
        .select()
        .single();

      if (error) throw error;
      return droneDoRegistro(data);
    },

    async listarTodos() {
      const { data, error } = await supabase.from('drones').select('*').order('criado_em');
      if (error) throw error;
      return data.map(droneDoRegistro);
    },

    async listarDisponiveis() {
      const { data, error } = await supabase.from('drones').select('*').eq('estado', 'idle').order('criado_em');
      if (error) throw error;
      return data.map(droneDoRegistro);
    },

    async buscarPorId(id) {
      const { data, error } = await supabase.from('drones').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? droneDoRegistro(data) : null;
    },

    async atualizarEstado(id, estado) {
      const { data, error } = await supabase.from('drones').update({ estado }).eq('id', id).select().single();
      if (error) throw error;
      return droneDoRegistro(data);
    },
  };
}

module.exports = { criarDroneRepository };
