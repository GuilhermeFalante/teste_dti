const { validarNovoPedido } = require('../domain/pedido');
const { ErroDominio } = require('../domain/erroDominio');
const { pedidoRepository } = require('../repositories');

async function registrarPedido(dados) {
  const pedidoValidado = validarNovoPedido(dados);
  return pedidoRepository.criar(pedidoValidado);
}

async function listarPedidos() {
  return pedidoRepository.listarTodos();
}

// Só permite remover pedidos ainda "pendente": um pedido já alocado/em rota/entregue
// faz parte de uma viagem (viagem_pedidos referencia o pedido), então removê-lo
// deixaria a viagem com um registro órfão.
async function removerPedido(id) {
  const pedido = await pedidoRepository.buscarPorId(id);
  if (!pedido) {
    throw new ErroDominio('Pedido não encontrado.', 404);
  }
  if (pedido.status !== 'pendente') {
    throw new ErroDominio(
      `Só é possível remover pedidos com status "pendente" (status atual: "${pedido.status}").`,
      409,
    );
  }

  await pedidoRepository.remover(id);
}

module.exports = { registrarPedido, listarPedidos, removerPedido };
