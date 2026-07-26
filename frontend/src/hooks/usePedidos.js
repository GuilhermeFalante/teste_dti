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

  return { pedidos, carregando, erro, recarregar, criarPedido };
}

export default usePedidos;
