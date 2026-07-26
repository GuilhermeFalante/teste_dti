import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

function useRelatorio() {
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setRelatorio(await api.buscarRelatorio());
    } catch (erroCapturado) {
      setErro(erroCapturado.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { relatorio, carregando, erro, recarregar };
}

export default useRelatorio;
