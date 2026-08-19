do $$ begin
  create type status_peticao as enum ('aguardando', 'distribuida', 'cancelada');
exception when duplicate_object then null; end $$;

create table peticoes (
  id               uuid           primary key default gen_random_uuid(),
  cliente_id       uuid           not null references clientes(id) on delete cascade,
  responsavel_id   uuid           references usuarios(id) on delete set null,
  processo_id      uuid           references processos(id) on delete set null,
  parte_adversa    text,
  natureza_acao    text           not null,
  data_contratacao date           not null,
  urgente          boolean        not null default false,
  prescricao       boolean        not null default false,
  decadencia       boolean        not null default false,
  observacoes      text,
  status           status_peticao not null default 'aguardando',
  distribuida_em   timestamptz,
  criado_por       uuid           not null references usuarios(id) on delete restrict,
  criado_em        timestamptz    not null default now(),
  atualizado_em    timestamptz,
  atualizado_por   uuid           references usuarios(id) on delete set null
);

alter table peticoes enable row level security;

create policy "equipe_all_peticoes" on peticoes
  for all to authenticated
  using (
    exists (
      select 1 from usuarios u
      where u.id = auth.uid()
        and u.papel in ('admin','advogado','secretaria')
    )
  )
  with check (
    exists (
      select 1 from usuarios u
      where u.id = auth.uid()
        and u.papel in ('admin','advogado','secretaria')
    )
  );
