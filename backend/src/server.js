require('dotenv').config();

const app = require('./app');

const PORTA = process.env.PORT || 3333;

app.listen(PORTA, () => {
  console.log(`Backend do simulador de drones rodando na porta ${PORTA}`);
});
