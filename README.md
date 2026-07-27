# Simulador de Encomendas em Drone

## Como rodar o projeto

Pré-requisitos: Node.js.

### 1. Backend

```bash
cd backend
npm install
npm run dev             # sobe o servidor com reload em http://localhost:3333
npm test                # roda os testes unitários do domínio
```

### 2. Frontend

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
reduzindo o alcance efetivo, obstáculo aumentando a distância real), o despacho manual, a fila de
entrega, o Dijkstra genérico usado para contornar obstáculos e o cálculo do relatório (entregas
realizadas, tempo médio, drone mais eficiente).

## Endpoints

| Método | Rota                | Descrição                                                        |
|--------|----------------------|-------------------------------------------------------------------|
| POST   | `/drones`            | Cadastra um drone (`nome`, `capacidadeKg`, `alcanceKm`, `velocidadeKmH?`) |
| GET    | `/drones/status`     | Lista todos os drones, estado atual e bateria                    |
| PUT    | `/drones/:id`        | Atualiza um drone (mesmos campos do cadastro)                    |
| DELETE | `/drones/:id`        | Remove um drone em cascata (veja abaixo)                         |
| PATCH  | `/drones/:id/estado` | Avança o drone para o próximo estado (`estado` no body)          |
| POST   | `/pedidos`           | Cria um pedido (`clienteX`, `clienteY`, `pesoKg`, `prioridade`)   |
| GET    | `/pedidos`           | Lista todos os pedidos                                            |
| DELETE | `/pedidos/:id`       | Remove um pedido (só se estiver `pendente`, veja abaixo)         |
| POST   | `/obstaculos`        | Cadastra uma zona de exclusão aérea circular (`nome`, `centroX`, `centroY`, `raioKm`) |
| GET    | `/obstaculos`        | Lista os obstáculos cadastrados                                   |
| PUT    | `/obstaculos/:id`    | Atualiza um obstáculo (mesmos campos do cadastro)                |
| DELETE | `/obstaculos/:id`    | Remove um obstáculo                                               |
| POST   | `/entregas/alocar`   | Roda a alocação automática: agrupa pedidos pendentes em viagens de drones idle |
| POST   | `/entregas/despachar`| Despacho manual: escolhe `droneId` e `pedidoIds` explicitamente (veja abaixo) |
| GET    | `/entregas/rota`     | Lista as viagens criadas, pedidos (em ordem de entrega) e distância |
| GET    | `/entregas/fila`     | Fila de pedidos pendentes, ordenada por prioridade + chegada     |
| GET    | `/relatorio`         | Entregas realizadas, tempo médio por entrega e drone mais eficiente |

### Máquina de estados do drone

```
idle → carregando → em_voo → entregando → retornando → idle
```

`POST /entregas/alocar` e `POST /entregas/despachar` já movem o drone de `idle` para `carregando`
ao montar a viagem. **Daí em diante o ciclo avança sozinho**, simulado por
`backend/src/services/simulacaoVooService.js`: o backend agenda, em background (sem bloquear a
resposta HTTP), as próximas transições via `setTimeout`, chamando a mesma lógica de
`PATCH /drones/:id/estado` internamente — não precisa clicar em nada pra ver o pedido e o drone
mudando de status. `PATCH /drones/:id/estado` continua disponível pra quem quiser forçar/pular uma
transição manualmente (a UI ainda mostra os botões).

Cada transição também atualiza o status dos pedidos da viagem ativa desse drone:

- `carregando → em_voo`: pedidos da viagem passam de `alocado` para `em_rota`.
- `em_voo → entregando`: pedidos passam para `entregue`.
- `entregando → retornando`: a viagem é marcada como `concluida`.
- `retornando → idle`: drone livre de novo para uma nova alocação/despacho.

**Tempo simulado**: 1 hora de voo (`distância / velocidadeKmH`) equivale a 60 segundos reais,
limitado entre 3s e 20s por trecho (pra dar pra acompanhar numa demonstração sem esperar minutos
reais). `carregando` e `entregando` duram 3s fixos. Se alguém avançar o estado manualmente
enquanto a simulação está rodando, a próxima transição automática vai falhar (estado inesperado) e
a simulação simplesmente para por ali — sem crashar nada.

No frontend, `App.jsx` faz *polling* a cada 2s (só enquanto existir algum drone fora do estado
`idle`) para as telas acompanharem essas mudanças automáticas sem precisar recarregar a página.

### Despacho manual

`POST /entregas/despachar` (`{ droneId, pedidoIds }`) monta uma viagem com o drone e os pedidos
escolhidos manualmente, em vez de rodar a heurística automática — útil para decidir "esse drone
específico entrega esses pedidos específicos". Valida as mesmas regras da alocação automática
(peso ≤ capacidade, distância da rota ≤ alcance efetivo considerando bateria e obstáculos, drone
precisa estar `idle`), rejeitando com 422/409 quando a combinação não é viável. A ordem de entrega
retornada segue a mesma heurística de vizinho mais próximo usada na alocação automática — não é
necessariamente a ordem em que os pedidos foram enviados no body.

### Remoção de drone em cascata

`DELETE /drones/:id` remove o drone e, em cascata (FK `on delete cascade` no banco — ver
[supabase/migrations/0003_cascade_remocao_drone.sql](supabase/migrations/0003_cascade_remocao_drone.sql)),
todas as viagens dele e os itens de `viagem_pedidos` associados. Antes de remover, o backend
identifica os pedidos que estavam nessas viagens e devolve o status deles para `pendente`, para
que fiquem disponíveis para realocação em outro drone — nenhum pedido é apagado. O frontend avisa
esse efeito num `confirm()` antes de chamar a API.

### Remoção de pedido

`DELETE /pedidos/:id` só é permitido enquanto o pedido está `pendente`. Um pedido `alocado`,
`em_rota` ou `entregue` já faz parte de uma viagem (`viagem_pedidos` referencia o pedido), então
removê-lo deixaria a viagem com um registro órfão — a API responde 409 nesse caso. No frontend, a
tabela de Pedidos só mostra o botão de remover para os pedidos pendentes.

### Relatório

`GET /relatorio` (`backend/src/domain/relatorio.js`, puro e testado isoladamente) calcula, a partir
das viagens **concluídas** (`status = 'concluida'`, ou seja, o drone já voltou pra base):

- **Entregas realizadas**: soma da quantidade de pedidos de cada viagem concluída.
- **Tempo médio por entrega**: média de `distanciaTotalKm / velocidadeKmH` das viagens concluídas
  (tempo estimado de voo por viagem — não há timestamp de entrega real por pedido individual).
- **Drone mais eficiente**: o drone com mais pedidos entregues por km percorrido
  (`pedidosEntregues / distanciaTotalKm`, somando todas as viagens concluídas dele) — favorece
  quem entrega mais em menos distância, não só quem entrega mais.

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
4. Pedidos que não cabem em nenhum drone disponível voltam em `naoAlocados` com um motivo
   específico:
   - peso acima da capacidade do maior drone disponível;
   - distância acima do alcance de qualquer drone — e, quando um obstáculo é o responsável por
     empurrar a rota além do alcance, a mensagem cita isso explicitamente (com a distância antes/
     depois do desvio);
   - zonas de exclusão aérea que cercam o cliente por completo (nenhuma rota possível até ele);
   - ou, quando existe drone capaz mas nenhum sobrou (todos já usados por outros pedidos na mesma
     rodada), um aviso para tentar de novo depois ou despachar manualmente.
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
  hooks/             useDrones, usePedidos, useObstaculos, useEntregas, useRelatorio — dados + loading/erro + ações
  components/        DronesPanel, PedidosPanel, ObstaculosPanel, EntregasPanel, MapaEntregas, DashboardPanel
```

Telas (navegação por abas em `App.jsx`, sem router — escopo pequeno o suficiente para não precisar):

- **Dashboard** (tela inicial): os três números do relatório (entregas realizadas, tempo médio por
  entrega, drone mais eficiente) em cartões, com o mesmo Mapa embutido logo abaixo.
- **Mapa**: SVG com a base (0,0), pedidos (coloridos por prioridade), obstáculos (círculos
  tracejados), as rotas das viagens já criadas (uma linha por viagem: base → paradas na ordem de
  entrega → base) e um ícone (🚁) por drone. A posição do drone segue o estado real dele:
  `idle`/`carregando` ficam na base, `entregando` fica na última parada, `retornando` volta pra
  base. Ao entrar em `em_voo` ou `retornando`, o ícone **percorre a própria linha traçada da
  viagem** (`<animateMotion>` sobre o mesmo path do polyline, ~3s, parada por parada — não pula
  direto pro destino final quando há mais de um pedido na viagem); os demais estados usam uma
  transição CSS simples (`transition: transform`) já que não envolvem trajeto. Avançar o estado do
  drone (em Drones ou na tabela de viagens em Entregas) dispara essa animação. Ao despachar uma
  entrega (manual ou automática), a aba troca para o Mapa automaticamente.
- **Entregas**: botão para rodar a alocação automática (`POST /entregas/alocar`), um formulário de
  **despacho manual** (escolhe um drone `idle` e marca os pedidos pendentes que ele vai entregar,
  mostrando o peso selecionado em tempo real), fila de pendentes e tabela de viagens (drone,
  distância, tempo estimado, ordem de entrega, e botões para avançar o estado do drone daquela
  viagem — o que atualiza o status dos pedidos junto, como descrito acima).
- **Pedidos**: formulário de cadastro + listagem.
- **Drones / Obstáculos**: formulário de cadastro + listagem, com edição (botão "Editar" carrega o
  registro de volta no formulário) e remoção (com confirmação) por linha.

## Uso de IA

Backend desenvolvido com apoio do Claude Code. Criei um agente próprio
([.claude/agents/fullstack-dev.md](.claude/agents/fullstack-dev.md)) com as convenções e
arquitetura deste repositório, para reduzir erros e manter a IA consistente com o padrão do
projeto. As regras de negócio usadas estão em [docs/CHALLENGE.md](docs/CHALLENGE.md).
