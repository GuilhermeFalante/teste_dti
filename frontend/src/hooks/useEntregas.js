import { useCallback, useState } from 'react';
import api from '../services/api';
import useRequisicao from './useRequisicao';

function useEntregas() {
  const carregarFila = useCallback(() => api.listarFilaDeEntrega(), []);
  const carregarRotas = useCallback(() => api.listarRotas(), []);
  const fila = useRequisicao(carregarFila);
  const rotas = useRequisicao(carregarRotas);
  const { recarregar: recarregarFila } = fila;
  const { recarregar: recarregarRotas } = rotas;

  const [alocando, setAlocando] = useState(false);
  const [resultadoAlocacao, setResultadoAlocacao] = useState(null);
  const [erroAlocacao, setErroAlocacao] = useState(null);

  async function alocar() {
    setAlocando(true);
    setErroAlocacao(null);
    try {
      const resultado = await api.alocarEntregas();
      setResultadoAlocacao(resultado);
      await Promise.all([recarregarFila(), recarregarRotas()]);
      return resultado;
    } catch (erroCapturado) {
      setErroAlocacao(erroCapturado.message);
      return null;
    } finally {
      setAlocando(false);
    }
  }

  async function despachar(dados) {
    const resultado = await api.despacharEntrega(dados);
    await Promise.all([recarregarFila(), recarregarRotas()]);
    return resultado;
  }

  const recarregarTudo = useCallback(
    (opcoes) => Promise.all([recarregarFila(opcoes), recarregarRotas(opcoes)]),
    [recarregarFila, recarregarRotas],
  );

  return {
    fila: fila.dados,
    filaCarregando: fila.carregando,
    filaErro: fila.erro,
    rotas: rotas.dados,
    rotasCarregando: rotas.carregando,
    rotasErro: rotas.erro,
    recarregarTudo,
    alocando,
    resultadoAlocacao,
    erroAlocacao,
    alocar,
    despachar,
  };
}

export default useEntregas;
