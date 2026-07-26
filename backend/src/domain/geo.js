function calcularDistancia(pontoA, pontoB) {
  return Math.sqrt((pontoA.x - pontoB.x) ** 2 + (pontoA.y - pontoB.y) ** 2);
}

function calcularDistanciaRota(pontos, base = { x: 0, y: 0 }) {
  const percurso = [base, ...pontos, base];
  let total = 0;
  for (let i = 0; i < percurso.length - 1; i += 1) {
    total += calcularDistancia(percurso[i], percurso[i + 1]);
  }
  return total;
}

// Heurística "vizinho mais próximo": não resolve o TSP de forma ótima,
// mas evita rotas obviamente ruins (zig-zag) com custo O(n²) barato para poucos pontos por viagem.
function ordenarRotaVizinhoMaisProximo(pontos, base = { x: 0, y: 0 }) {
  const restantes = [...pontos];
  const ordenados = [];
  let atual = base;

  while (restantes.length > 0) {
    let indiceMaisProximo = 0;
    let menorDistancia = calcularDistancia(atual, restantes[0]);

    for (let i = 1; i < restantes.length; i += 1) {
      const distancia = calcularDistancia(atual, restantes[i]);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        indiceMaisProximo = i;
      }
    }

    const [proximo] = restantes.splice(indiceMaisProximo, 1);
    ordenados.push(proximo);
    atual = proximo;
  }

  return ordenados;
}

module.exports = { calcularDistancia, calcularDistanciaRota, ordenarRotaVizinhoMaisProximo };
