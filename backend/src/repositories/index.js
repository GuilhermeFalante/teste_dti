const { criarClienteSupabase } = require('./supabaseClient');
const { criarDroneRepository } = require('./droneRepository');
const { criarPedidoRepository } = require('./pedidoRepository');
const { criarViagemRepository } = require('./viagemRepository');

const supabase = criarClienteSupabase();

const droneRepository = criarDroneRepository(supabase);
const pedidoRepository = criarPedidoRepository(supabase);
const viagemRepository = criarViagemRepository(supabase);

module.exports = { droneRepository, pedidoRepository, viagemRepository };
