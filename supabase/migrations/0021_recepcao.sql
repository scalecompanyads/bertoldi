create table recepcoes (
  id             uuid        primary key default gen_random_uuid(),
  cliente_id     uuid        references clientes(id) on delete set null,
  cliente_nome   text        not null,
  chegada        timestamptz not null default now(),
  saida          timestamptz,
  assunto        text,
  providencia    text,
  responsavel_id uuid        references usuarios(id) on delete set null,
  criado_por     uuid        not null references usuarios(id) on delete restrict,
  criado_em      timestamptz not null default now()
);

alter table recepcoes enable row level security;

create policy "equipe_all_recepcoes" on recepcoes
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
