-- Monitor de intimações via DJEN (Comunica/CNJ).
-- O cron busca diariamente as comunicações publicadas em nome de cada advogado
-- da equipe (por número OAB) e as vincula aos processos cadastrados.

-- OAB do advogado — usada como filtro na API do Comunica
alter table public.usuarios
  add column if not exists oab_numero text,
  add column if not exists oab_uf     text;

create type status_intimacao as enum ('nao_lida', 'lida', 'tratada');

create table intimacoes (
  id                     uuid             primary key default gen_random_uuid(),
  -- id da comunicação na API do Comunica — evita duplicar na re-sincronização
  comunica_id            bigint           not null unique,
  advogado_id            uuid             references usuarios(id) on delete set null,
  processo_id            uuid             references processos(id) on delete set null,
  numero_cnj             text,
  sigla_tribunal         text,
  tipo_comunicacao       text,
  nome_orgao             text,
  nome_classe            text,
  meio                   text,
  link                   text,
  texto                  text,
  data_disponibilizacao  date             not null,
  status                 status_intimacao not null default 'nao_lida',
  criado_em              timestamptz      not null default now()
);

create index idx_intimacoes_status on intimacoes (status, data_disponibilizacao desc);
create index idx_intimacoes_processo on intimacoes (processo_id) where processo_id is not null;
create index idx_intimacoes_data on intimacoes (data_disponibilizacao desc);

alter table intimacoes enable row level security;

-- Intimação é assunto interno do escritório — cliente não vê
create policy "equipe: acesso total a intimacoes" on intimacoes
  for all
  using (
    exists (
      select 1 from usuarios u where u.id = auth.uid()
        and u.papel in ('admin', 'advogado', 'secretaria')
    )
  )
  with check (
    exists (
      select 1 from usuarios u where u.id = auth.uid()
        and u.papel in ('admin', 'advogado', 'secretaria')
    )
  );
