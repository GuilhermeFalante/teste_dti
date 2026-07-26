const { menorCaminho } = require('./dijkstra');

const PONTOS_PERIMETRO_POR_OBSTACULO = 8;
const MARGEM_PERIMETRO = 1.05; // afasta o waypoint um pouco da borda para não "raspar" no obstáculo

function distanciaEuclidiana(pontoA, pontoB) {
  return Math.sqrt((pontoA.x - pontoB.x) ** 2 + (pontoA.y - pontoB.y) ** 2);
}

// Testa se o segmento pontoA-pontoB cruza o círculo do obstáculo (interseção segmento-círculo).
function segmentoIntersectaObstaculo(pontoA, pontoB, obstaculo) {
  const dx = pontoB.x - pontoA.x;
  const dy = pontoB.y - pontoA.y;
  const fx = pontoA.x - obstaculo.x;
  const fy = pontoA.y - obstaculo.y;

  const a = dx * dx + dy * dy;
  if (a === 0) {
    return distanciaEuclidiana(pontoA, obstaculo) < obstaculo.raioKm;
  }

  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - obstaculo.raioKm * obstaculo.raioKm;
  const discriminante = b * b - 4 * a * c;
  if (discriminante < 0) return false;

  const raiz = Math.sqrt(discriminante);
  const t1 = (-b - raiz) / (2 * a);
  const t2 = (-b + raiz) / (2 * a);

  return t2 >= 0 && t1 <= 1;
}

function segmentoLivre(pontoA, pontoB, obstaculos) {
  return obstaculos.every((obstaculo) => !segmentoIntersectaObstaculo(pontoA, pontoB, obstaculo));
}

function pontosPerimetroObstaculo(obstaculo) {
  const raio = obstaculo.raioKm * MARGEM_PERIMETRO;
  return Array.from({ length: PONTOS_PERIMETRO_POR_OBSTACULO }, (_, i) => {
    const angulo = (2 * Math.PI * i) / PONTOS_PERIMETRO_POR_OBSTACULO;
    return { x: obstaculo.x + raio * Math.cos(angulo), y: obstaculo.y + raio * Math.sin(angulo) };
  });
}

// Contorna obstáculos com um visibility graph: nós = origem, destino e pontos ao redor de cada
// obstáculo; arestas ligam nós que "se enxergam" (segmento livre de qualquer obstáculo). O menor
// caminho nesse grafo é resolvido com Dijkstra. Não é geometricamente ótimo (usa amostragem do
// perímetro, não as tangentes exatas), mas é uma aproximação simples e suficiente para o desafio.
function calcularCaminhoContornandoObstaculos(pontoA, pontoB, obstaculos) {
  const nos = { origem: pontoA, destino: pontoB };
  obstaculos.forEach((obstaculo, indiceObstaculo) => {
    pontosPerimetroObstaculo(obstaculo).forEach((ponto, indicePonto) => {
      nos[`obstaculo${indiceObstaculo}-${indicePonto}`] = ponto;
    });
  });

  const idsNos = Object.keys(nos);
  const grafo = Object.fromEntries(idsNos.map((id) => [id, []]));

  for (let i = 0; i < idsNos.length; i += 1) {
    for (let j = i + 1; j < idsNos.length; j += 1) {
      const idA = idsNos[i];
      const idB = idsNos[j];
      if (segmentoLivre(nos[idA], nos[idB], obstaculos)) {
        const distancia = distanciaEuclidiana(nos[idA], nos[idB]);
        grafo[idA].push({ para: idB, peso: distancia });
        grafo[idB].push({ para: idA, peso: distancia });
      }
    }
  }

  return menorCaminho(grafo, 'origem', 'destino');
}

// Distância entre dois pontos. Sem obstáculos (caso comum), é só a euclidiana; com obstáculos
// que bloqueiam a linha reta, contorna-os via calcularCaminhoContornandoObstaculos.
function calcularDistancia(pontoA, pontoB, obstaculos = []) {
  if (obstaculos.length === 0 || segmentoLivre(pontoA, pontoB, obstaculos)) {
    return distanciaEuclidiana(pontoA, pontoB);
  }
  return calcularCaminhoContornandoObstaculos(pontoA, pontoB, obstaculos);
}

function calcularDistanciaRota(pontos, base = { x: 0, y: 0 }, obstaculos = []) {
  const percurso = [base, ...pontos, base];
  let total = 0;
  for (let i = 0; i < percurso.length - 1; i += 1) {
    total += calcularDistancia(percurso[i], percurso[i + 1], obstaculos);
  }
  return total;
}

// Heurística "vizinho mais próximo": não resolve o TSP de forma ótima,
// mas evita rotas obviamente ruins (zig-zag) com custo O(n²) barato para poucos pontos por viagem.
function ordenarRotaVizinhoMaisProximo(pontos, base = { x: 0, y: 0 }, obstaculos = []) {
  const restantes = [...pontos];
  const ordenados = [];
  let atual = base;

  while (restantes.length > 0) {
    let indiceMaisProximo = 0;
    let menorDistancia = calcularDistancia(atual, restantes[0], obstaculos);

    for (let i = 1; i < restantes.length; i += 1) {
      const distancia = calcularDistancia(atual, restantes[i], obstaculos);
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

module.exports = {
  calcularDistancia,
  calcularDistanciaRota,
  ordenarRotaVizinhoMaisProximo,
  segmentoIntersectaObstaculo,
};
