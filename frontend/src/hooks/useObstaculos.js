import { useCallback } from 'react';
import api from '../services/api';
import useRequisicao from './useRequisicao';

function useObstaculos() {
  const carregar = useCallback(() => api.listarObstaculos(), []);
  const { dados: obstaculos, carregando, erro, recarregar } = useRequisicao(carregar);

  async function criarObstaculo(dados) {
    await api.criarObstaculo(dados);
    await recarregar();
  }

  async function atualizarObstaculo(id, dados) {
    await api.atualizarObstaculo(id, dados);
    await recarregar();
  }

  async function removerObstaculo(id) {
    await api.removerObstaculo(id);
    await recarregar();
  }

  return { obstaculos, carregando, erro, recarregar, criarObstaculo, atualizarObstaculo, removerObstaculo };
}

export default useObstaculos;
