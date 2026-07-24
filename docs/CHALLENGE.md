# Simulador de Encomendas em Drone — Contexto do Desafio

Documento de regras de negócio e escopo do desafio técnico (processo seletivo DTI Digital). Separado de `.claude/agents/fullstack-dev.md`, que contém apenas as instruções genéricas do agente de programação — as regras específicas desta aplicação vivem aqui.

## Contexto

Startup de logística testando entregas por drones em áreas urbanas. O sistema gerencia entregas, drones e voos, respeitando regras de capacidade, distância e prioridade de entrega.

## Regras básicas (obrigatórias)

- **Capacidade do drone**: cada drone suporta até X kg e até Y km por carga (parametrizável).
- **Mapa**: cidade representada como malha de coordenadas 2D (X, Y).
- **Pedidos**: cada pedido tem localização do cliente (X, Y), peso do pacote e prioridade (baixa, média, alta).
- **Objetivo principal**: alocar pacotes nos drones minimizando o número de viagens, respeitando capacidade e alcance.

## Funcionalidades avançadas (valorizadas, não obrigatórias)

- Simular bateria do drone (decai com tempo/distância).
- Obstáculos / zonas de exclusão aérea entre pontos.
- Cálculo de tempo total de entrega.
- Fila de entrega ordenada por prioridade + tempo de chegada.

## Diferenciais

- **Otimização inteligente**: priorizar por peso, prioridade e distância; buscar combinações de pacotes por viagem que maximizem uso do drone (capacidade + alcance). Documentar a estratégia/heurística escolhida.
- **Simulação orientada a eventos**: máquina de estados do drone: `Idle → Carregando → Em voo → Entregando → Retornando → Idle`. Tempo de voo pode ser simulado com timestamps ou threads/sleep.
- **API RESTful**: `POST /pedidos`, `GET /entregas/rota`, `GET /drones/status` (ou CLI/GUI equivalente).
- **Testes automatizados**: cobertura das regras principais + simulações de carga (muitos pedidos simultâneos).
- **Tratamento de erros e validações**: rejeitar pacotes acima da capacidade do drone; mensagens claras para entradas inválidas.
- **Relatório/Dashboard**: quantidade de entregas realizadas, tempo médio por entrega, drone mais eficiente, mapa das entregas (ASCII ou gráfico).
- **Criatividade extra**: recarga automática (volta à base com bateria baixa), feedback textual de status ao cliente (ex.: "seu pacote está a 2 quadras de distância").

## Entregáveis do processo seletivo

Obrigatórios:
- README explicando como executar o projeto.
- Testes unitários cobrindo as regras principais.
- Repositório público no GitHub, com o link enviado por e-mail para rh.hakuna@dtidigital.com.br (ação do usuário, não da IA).

Opcionais:
- Markdown de rules/memórias/prompts usados na IA (este documento + `.claude/agents/fullstack-dev.md` cobrem essa parte).
- Deploy ou link do projeto funcionando.

## Stack

- Backend: Node.js, em `backend/`.
- Frontend: React, em `frontend/`.
