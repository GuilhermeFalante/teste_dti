-- Funcionalidades avançadas: bateria (consumo por distância), obstáculos (zonas de
-- exclusão aérea) e velocidade do drone (usada para calcular tempo estimado de entrega).

alter table drones
  add column velocidade_kmh numeric not null default 40 check (velocidade_kmh > 0);

create table obstaculos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  centro_x numeric not null,
  centro_y numeric not null,
  raio_km numeric not null check (raio_km > 0),
  criado_em timestamptz not null default now()
);

alter table obstaculos enable row level security;
