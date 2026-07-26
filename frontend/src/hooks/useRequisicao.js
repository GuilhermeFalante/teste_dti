import { useCallback, useEffect, useState } from 'react';

// Fetch + loading/erro genérico: usado por todo hook que só precisa carregar uma lista
// da API e recarregá-la depois de uma ação (criar, atualizar etc.).
function useRequisicao(carregar) {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setDados(await carregar());
    } catch (erroCapturado) {
      setErro(erroCapturado.message);
    } finally {
      setCarregando(false);
    }
  }, [carregar]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { dados, carregando, erro, recarregar };
}

export default useRequisicao;
