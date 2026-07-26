import { useCallback } from 'react';
import api from '../services/api';
import useRequisicao from './useRequisicao';

function usePedidos() {
  const carregar = useCallback(() => api.listarPedidos(), []);
  const { dados: pedidos, carregando, erro, recarregar } = useRequisicao(carregar);

  async function criarPedido(dados) {
    await api.criarPedido(dados);
    await recarregar();
  }

  async function removerPedido(id) {
    await api.removerPedido(id);
    await recarregar();
  }

  return { pedidos, carregando, erro, recarregar, criarPedido, removerPedido };
}

export default usePedidos;
