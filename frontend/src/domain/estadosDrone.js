// Espelha backend/src/domain/droneStateMachine.js: só existe para desabilitar no formulário
// as transições que o backend rejeitaria de qualquer forma.
export const PROXIMOS_ESTADOS = {
  idle: ['carregando'],
  carregando: ['em_voo'],
  em_voo: ['entregando'],
  entregando: ['retornando'],
  retornando: ['idle'],
};
