function MensagemErro({ mensagem }) {
  if (!mensagem) return null;
  return <p className="mensagem-erro">{mensagem}</p>;
}

export default MensagemErro;
