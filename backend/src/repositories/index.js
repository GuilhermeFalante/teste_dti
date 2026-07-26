const { criarClienteSupabase } = require('./supabaseClient');
const { criarDroneRepository } = require('./droneRepository');
const { criarPedidoRepository } = require('./pedidoRepository');
const { criarViagemRepository } = require('./viagemRepository');
const { criarObstaculoRepository } = require('./obstaculoRepository');

const supabase = criarClienteSupabase();

const droneRepository = criarDroneRepository(supabase);
const pedidoRepository = criarPedidoRepository(supabase);
const viagemRepository = criarViagemRepository(supabase);
const obstaculoRepository = criarObstaculoRepository(supabase);

module.exports = { droneRepository, pedidoRepository, viagemRepository, obstaculoRepository };
