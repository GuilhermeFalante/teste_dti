const pedidoService = require('../services/pedidoService');

async function criar(req, res, next) {
  try {
    const { clienteX, clienteY, pesoKg, prioridade } = req.body;
    const pedido = await pedidoService.registrarPedido({ clienteX, clienteY, pesoKg, prioridade });
    res.status(201).json(pedido);
  } catch (erro) {
    next(erro);
  }
}

async function listar(req, res, next) {
  try {
    res.json(await pedidoService.listarPedidos());
  } catch (erro) {
    next(erro);
  }
}

async function remover(req, res, next) {
  try {
    const { id } = req.params;
    await pedidoService.removerPedido(id);
    res.status(204).send();
  } catch (erro) {
    next(erro);
  }
}

module.exports = { criar, listar, remover };
