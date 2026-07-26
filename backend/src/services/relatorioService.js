const { calcularRelatorio } = require('../domain/relatorio');
const { droneRepository } = require('../repositories');
const { listarRotas } = require('./entregaService');

async function gerarRelatorio() {
  const [viagens, drones] = await Promise.all([listarRotas(), droneRepository.listarTodos()]);
  return calcularRelatorio(viagens, drones);
}

module.exports = { gerarRelatorio };
