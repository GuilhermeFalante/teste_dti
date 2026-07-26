# Simulador de Encomendas em Drone

Sistema que aloca pedidos de entrega em drones, respeitando capacidade (kg), alcance (km) e prioridade, minimizando o número de viagens.

Contexto completo das regras em [docs/CHALLENGE.md](docs/CHALLENGE.md).

## Stack

- **Backend**: Node.js + Express, em [backend/](backend/), com Supabase (Postgres) como persistência.
- **Frontend**: ainda não implementado (próxima etapa).

## Como rodar o projeto

### 1. Passo a passo

```bash
cd backend
npm install
npm run dev      # sobe o servidor com reload em http://localhost:3333
npm test         # roda os testes unitários do domínio
```

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

`backend/tests/` cobre as regras principais do domínio: validação de pedidos, transições da
máquina de estados do drone e a heurística de alocação (casos de borda: capacidade estourada,
alcance insuficiente, sem drones disponíveis, múltiplos pedidos na mesma viagem).

## Endpoints

| Método | Rota                | Descrição                                                        |
|--------|----------------------|-------------------------------------------------------------------|
| POST   | `/drones`            | Cadastra um drone (`nome`, `capacidadeKg`, `alcanceKm`)           |
| GET    | `/drones/status`     | Lista todos os drones e seu estado atual                         |
| PATCH  | `/drones/:id/estado` | Avança o drone para o próximo estado (`estado` no body)          |
| POST   | `/pedidos`           | Cria um pedido (`clienteX`, `clienteY`, `pesoKg`, `prioridade`)   |
| GET    | `/pedidos`           | Lista todos os pedidos                                            |
| POST   | `/entregas/alocar`   | Roda a alocação: agrupa pedidos pendentes em viagens de drones idle |
| GET    | `/entregas/rota`     | Lista as viagens criadas e os pedidos de cada uma                |

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

## Uso de IA

([.claude/agents/fullstack-dev.md](.claude/agents/fullstack-dev.md)) com as convenções e
arquitetura deste repositório, para reduzir erros e manter a IA consistente com o padrão do
projeto. As regras de negócio usadas estão em [docs/CHALLENGE.md](docs/CHALLENGE.md).
