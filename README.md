# Simulador de Encomendas em Drone

## Como rodar o projeto

Pré-requisitos: Node.js 18+ e um projeto Supabase (Postgres).

### 1. Banco de dados (Supabase)

Crie as tabelas `drones`, `pedidos`, `viagens`, `viagem_pedidos` e `obstaculos` no seu projeto
Supabase (via **SQL Editor** do dashboard). O SQL das migrations não está versionado neste
repositório — veja `backend/src/repositories/mapeadores.js` e os arquivos em
`backend/src/repositories/` para a forma exata de cada tabela (colunas em `snake_case`: por
exemplo `drones` tem `nome`, `capacidade_kg`, `alcance_km`, `velocidade_kmh`,
`bateria_percentual`, `estado`, `pos_x`, `pos_y`, `criado_em`).

### 2. Backend

```bash
cd backend
npm install
npm run dev             # sobe o servidor com reload em http://localhost:3333
npm test                # roda os testes unitários do domínio
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev      # sobe em http://localhost:5173, consumindo a API em http://localhost:3333
```

A URL da API é configurável em `frontend/.env` (`VITE_API_URL`, padrão `http://localhost:3333`).
O frontend precisa do backend rodando para funcionar (todas as telas dependem da API).

## Sobre o projeto

Sistema que aloca pedidos de entrega em drones, respeitando capacidade (kg), alcance (km) e prioridade, minimizando o número de viagens.

Contexto completo das regras em [docs/CHALLENGE.md](docs/CHALLENGE.md).

## Stack

- **Backend**: Node.js + Express, em [backend/](backend/), com Supabase (Postgres) como persistência.
- **Frontend**: React + Vite, em [frontend/](frontend/), consumindo a API do backend.

## Arquitetura do backend

```
backend/src/
  domain/        regras de negócio puras (sem Express, sem Supabase) — Pedido, Drone,
                 DroneStateMachine, AllocationService (heurística de alocação), geo (distâncias)
  repositories/  acesso a dados via @supabase/supabase-js
  services/      orquestra domínio + repositórios (casos de uso)
  controllers/   parseia request / formata response
  routes/        mapeamento de endpoints
```

## Testes

`backend/tests/` cobre as regras principais do domínio: validação de pedidos e drones, transições
da máquina de estados do drone, a heurística de alocação (casos de borda: capacidade estourada,
alcance insuficiente, sem drones disponíveis, múltiplos pedidos na mesma viagem, bateria baixa
reduzindo o alcance efetivo, obstáculo aumentando a distância real), a fila de entrega e o
Dijkstra genérico usado para contornar obstáculos.

## Endpoints

| Método | Rota                | Descrição                                                        |
|--------|----------------------|-------------------------------------------------------------------|
| POST   | `/drones`            | Cadastra um drone (`nome`, `capacidadeKg`, `alcanceKm`, `velocidadeKmH?`) |
| GET    | `/drones/status`     | Lista todos os drones, estado atual e bateria                    |
| PATCH  | `/drones/:id/estado` | Avança o drone para o próximo estado (`estado` no body)          |
| POST   | `/pedidos`           | Cria um pedido (`clienteX`, `clienteY`, `pesoKg`, `prioridade`)   |
| GET    | `/pedidos`           | Lista todos os pedidos                                            |
| POST   | `/obstaculos`        | Cadastra uma zona de exclusão aérea circular (`nome`, `centroX`, `centroY`, `raioKm`) |
| GET    | `/obstaculos`        | Lista os obstáculos cadastrados                                   |
| POST   | `/entregas/alocar`   | Roda a alocação: agrupa pedidos pendentes em viagens de drones idle |
| GET    | `/entregas/rota`     | Lista as viagens criadas, pedidos (em ordem de entrega) e distância |
| GET    | `/entregas/fila`     | Fila de pedidos pendentes, ordenada por prioridade + chegada     |

### Máquina de estados do drone

```
idle → carregando → em_voo → entregando → retornando → idle
```

`POST /entregas/alocar` já move o drone de `idle` para `carregando` automaticamente ao montar a
viagem. As demais transições são feitas manualmente via `PATCH /drones/:id/estado`.

### Fluxo de teste sugerido no Postman

1. `POST /drones` — cadastre um ou mais drones.
2. `POST /pedidos` — cadastre pedidos com pesos/prioridades/coordenadas variados.
3. `POST /entregas/alocar` — dispara a alocação; retorna as viagens criadas e pedidos que não
   couberam em nenhum drone (`naoAlocados`), se houver.
4. `GET /entregas/rota` — confirma as viagens e a ordem de entrega dos pedidos.
5. `GET /drones/status` — confirma que os drones alocados foram para o estado `carregando`.

## Regras de alocação

Implementada em `backend/src/domain/alocacaoService.js`:

1. Pedidos são ordenados por prioridade (alta > média > baixa), depois por peso (maior primeiro,
   para melhor aproveitar a capacidade dos drones), depois por ordem de chegada.
2. Para cada pedido, tenta-se encaixar em uma viagem já aberta (mesmo drone, mesma viagem) se o
   peso total não ultrapassar a capacidade e a rota recalculada não ultrapassar o alcance do drone.
3. Se não couber em nenhuma viagem aberta, abre-se uma viagem nova no menor drone (por capacidade)
   que suporte o pedido sozinho — drones maiores ficam reservados para pedidos mais pesados.
4. Pedidos que não cabem em nenhum drone disponível (peso ou distância acima do que qualquer drone
   suporta) voltam em `naoAlocados` com o motivo.
5. A distância de uma viagem com múltiplos pedidos é calculada com uma heurística de vizinho mais
   próximo (não é TSP ótimo, mas evita rotas em zig-zag óbvias) partindo e retornando à base (0,0).

## Funcionalidades avançadas

- **Bateria**: cada drone tem `bateriaPercentual` (0–100). O alcance efetivamente utilizável numa
  alocação é `alcanceKm * (bateriaPercentual / 100)` — com metade da bateria, só metade do alcance
  nominal é considerado. Ao despachar uma viagem, a bateria é decrementada proporcionalmente à
  distância percorrida (percorrer o alcance nominal inteiro gasta 100%). Ver `domain/drone.js`.
- **Obstáculos (zonas de exclusão aérea)**: cadastrados como círculos (`centroX`, `centroY`,
  `raioKm`) via `POST /obstaculos`. Ao calcular a distância de uma rota, se o caminho reto entre
  dois pontos cruzar algum obstáculo, o trajeto é recalculado contornando-o: um visibility graph é
  montado (base, destino e pontos ao redor da borda de cada obstáculo) e o menor caminho nesse
  grafo é resolvido com **Dijkstra** (`domain/dijkstra.js` + `domain/geo.js`). Isso pode aumentar a
  distância real da viagem a ponto de estourar o alcance do drone.
- **Tempo estimado de entrega**: cada drone tem `velocidadeKmH` (padrão 40 km/h, configurável na
  criação). `POST /entregas/alocar` retorna `tempoEstimadoHoras` por viagem
  (`distanciaTotal / velocidadeKmH`) — não é persistido, então `GET /entregas/rota` só traz a
  distância; o frontend recalcula o tempo ao exibir a lista de viagens.
- **Fila de entrega**: `GET /entregas/fila` lista os pedidos pendentes ordenados por prioridade
  (alta > média > baixa) e, dentro da mesma prioridade, por ordem de chegada (FIFO). É uma visão
  diferente da heurística de alocação (que também prioriza peso para otimizar o aproveitamento dos
  drones) — aqui o objetivo é só mostrar a ordem de atendimento.

## Frontend

```
frontend/src/
  services/api.js   toda comunicação com a API isolada aqui (fetch); componentes não chamam fetch direto
  hooks/             useDrones, usePedidos, useObstaculos, useEntregas — dados + loading/erro + ações
  components/        DronesPanel, PedidosPanel, ObstaculosPanel, EntregasPanel, MapaEntregas
```

Telas (navegação por abas em `App.jsx`, sem router — escopo pequeno o suficiente para não precisar):

- **Mapa**: SVG com a base (0,0), pedidos (coloridos por prioridade), obstáculos (círculos
  tracejados) e as rotas das viagens já criadas.
- **Entregas**: botão para rodar `POST /entregas/alocar`, fila de pendentes e tabela de viagens
  (drone, distância, tempo estimado, ordem de entrega).
- **Drones / Pedidos / Obstáculos**: formulário de cadastro + listagem de cada recurso.

## Uso de IA

Backend desenvolvido com apoio do Claude Code. Criei um agente próprio
([.claude/agents/fullstack-dev.md](.claude/agents/fullstack-dev.md)) com as convenções e
arquitetura deste repositório, para reduzir erros e manter a IA consistente com o padrão do
projeto. As regras de negócio usadas estão em [docs/CHALLENGE.md](docs/CHALLENGE.md).
