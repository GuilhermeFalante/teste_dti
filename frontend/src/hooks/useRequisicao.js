import { useCallback, useEffect, useState } from 'react';

// Fetch + loading/erro genérico: usado por todo hook que só precisa carregar uma lista
// da API e recarregá-la depois de uma ação (criar, atualizar etc.).
function useRequisicao(carregar) {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // silencioso: true evita ligar/desligar o "carregando" — usado no polling em segundo plano,
  // pra não ficar piscando "Carregando..." a cada rodada enquanto os dados já estão na tela.
  const recarregar = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!silencioso) setCarregando(true);
      setErro(null);
      try {
        setDados(await carregar());
      } catch (erroCapturado) {
        setErro(erroCapturado.message);
      } finally {
        if (!silencioso) setCarregando(false);
      }
    },
    [carregar],
  );

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { dados, carregando, erro, recarregar };
}

export default useRequisicao;
