create extension if not exists pg_trgm with schema extensions;

create index if not exists idx_clientes_nome_trgm
  on public.clientes using gin (nome extensions.gin_trgm_ops);
create index if not exists idx_processos_criado_em
  on public.processos (criado_em desc);
create index if not exists idx_processos_status
  on public.processos (status_interno);
create index if not exists idx_processos_cliente_criado
  on public.processos (cliente_id, criado_em desc);
create index if not exists idx_processos_responsavel
  on public.processos (responsavel_id)
  where responsavel_id is not null;
create unique index if not exists idx_processos_numero_cnj_unico
  on public.processos (numero_cnj)
  where numero_cnj is not null;
create index if not exists idx_verificacoes_processo_em
  on public.verificacoes_datajud (processo_id, verificado_em desc);

alter table public.processos
  add column proxima_verificacao_em timestamptz;

update public.processos
set proxima_verificacao_em = now()
where numero_cnj is not null
  and status_interno <> 'concluido'
  and proxima_verificacao_em is null;

create index idx_processos_proxima_verificacao
  on public.processos (proxima_verificacao_em)
  where numero_cnj is not null and status_interno <> 'concluido';
