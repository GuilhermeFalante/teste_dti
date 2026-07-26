function droneDoRegistro(registro) {
  return {
    id: registro.id,
    nome: registro.nome,
    capacidadeKg: Number(registro.capacidade_kg),
    alcanceKm: Number(registro.alcance_km),
    bateriaPercentual: Number(registro.bateria_percentual),
    estado: registro.estado,
    posX: Number(registro.pos_x),
    posY: Number(registro.pos_y),
    criadoEm: registro.criado_em,
  };
}

function pedidoDoRegistro(registro) {
  return {
    id: registro.id,
    clienteX: Number(registro.cliente_x),
    clienteY: Number(registro.cliente_y),
    pesoKg: Number(registro.peso_kg),
    prioridade: registro.prioridade,
    status: registro.status,
    criadoEm: registro.criado_em,
  };
}

function viagemDoRegistro(registro) {
  return {
    id: registro.id,
    droneId: registro.drone_id,
    status: registro.status,
    distanciaTotalKm: registro.distancia_total_km === null ? null : Number(registro.distancia_total_km),
    iniciadaEm: registro.iniciada_em,
    finalizadaEm: registro.finalizada_em,
  };
}

module.exports = { droneDoRegistro, pedidoDoRegistro, viagemDoRegistro };
