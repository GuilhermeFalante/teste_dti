import { useCallback } from 'react';
import api from '../services/api';
import useRequisicao from './useRequisicao';

function useDrones() {
  const carregar = useCallback(() => api.listarDrones(), []);
  const { dados: drones, carregando, erro, recarregar } = useRequisicao(carregar);

  async function criarDrone(dados) {
    await api.criarDrone(dados);
    await recarregar();
  }

  async function avancarEstadoDrone(id, estado) {
    await api.avancarEstadoDrone(id, estado);
    await recarregar();
  }

  return { drones, carregando, erro, recarregar, criarDrone, avancarEstadoDrone };
}

export default useDrones;
