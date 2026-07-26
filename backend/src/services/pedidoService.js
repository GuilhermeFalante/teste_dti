const { validarNovoPedido } = require('../domain/pedido');
const { pedidoRepository } = require('../repositories');

async function registrarPedido(dados) {
  const pedidoValidado = validarNovoPedido(dados);
  return pedidoRepository.criar(pedidoValidado);
}

async function listarPedidos() {
  return pedidoRepository.listarTodos();
}

module.exports = { registrarPedido, listarPedidos };
