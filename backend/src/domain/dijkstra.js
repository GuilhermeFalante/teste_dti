// Dijkstra genérico sobre um grafo pequeno (O(V²), sem fila de prioridade — desnecessária
// para o tamanho de grafo que este projeto gera: base + destino + pontos ao redor de obstáculos).
// grafo: { [noId]: [{ para, peso }] }
function menorCaminho(grafo, origem, destino) {
  const distancias = new Map();
  const visitados = new Set();
  const nos = Object.keys(grafo);

  nos.forEach((no) => distancias.set(no, Infinity));
  distancias.set(origem, 0);

  while (visitados.size < nos.length) {
    let atual = null;
    let menorDistancia = Infinity;

    for (const no of nos) {
      if (!visitados.has(no) && distancias.get(no) < menorDistancia) {
        menorDistancia = distancias.get(no);
        atual = no;
      }
    }

    if (atual === null || atual === destino) break;
    visitados.add(atual);

    for (const aresta of grafo[atual] ?? []) {
      const distanciaCandidata = distancias.get(atual) + aresta.peso;
      if (distanciaCandidata < distancias.get(aresta.para)) {
        distancias.set(aresta.para, distanciaCandidata);
      }
    }
  }

  return distancias.get(destino) ?? Infinity;
}

module.exports = { menorCaminho };
