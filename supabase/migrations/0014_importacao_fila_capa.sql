-- Importação em massa (item 2.1 do MELHORIAS.md).
-- Clientes e processos são criados na hora do upload; a busca da capa no
-- Datajud é lenta (30s+ por consulta em índices grandes), então cada processo
-- importado entra nesta fila e um cron preenche a capa aos poucos.

create type status_fila_capa as enum ('pendente', 'concluido', 'erro');

create table fila_capa (
  id            uuid             primary key default gen_random_uuid(),
  processo_id   uuid             not null unique references processos(id) on delete cascade,
  status        status_fila_capa not null default 'pendente',
  tentativas    int              not null default 0,
  erro          text,
  criado_em     timestamptz      not null default now(),
  processado_em timestamptz
);

create index idx_fila_capa_pendentes on fila_capa (criado_em) where status = 'pendente';

alter table fila_capa enable row level security;

-- Fila é assunto interno do escritório — cliente não vê
create policy "equipe: acesso total a fila_capa" on fila_capa
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
