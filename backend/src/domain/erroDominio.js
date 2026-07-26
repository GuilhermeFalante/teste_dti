class ErroDominio extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.name = 'ErroDominio';
    this.status = status;
  }
}

module.exports = { ErroDominio };
