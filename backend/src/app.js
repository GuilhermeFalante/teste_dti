const express = require('express');
const cors = require('cors');

const pedidoRoutes = require('./routes/pedidoRoutes');
const droneRoutes = require('./routes/droneRoutes');
const entregaRoutes = require('./routes/entregaRoutes');
const obstaculoRoutes = require('./routes/obstaculoRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes');
const { ErroDominio } = require('./domain/erroDominio');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/pedidos', pedidoRoutes);
app.use('/drones', droneRoutes);
app.use('/entregas', entregaRoutes);
app.use('/obstaculos', obstaculoRoutes);
app.use('/relatorio', relatorioRoutes);

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// eslint-disable-next-line no-unused-vars
app.use((erro, req, res, next) => {
  if (erro instanceof ErroDominio) {
    return res.status(erro.status).json({ erro: erro.message });
  }

  console.error(erro);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
});

module.exports = app;
