alter table public.clientes
  add column if not exists arquivado boolean not null default false,
  add column if not exists arquivado_em timestamptz,
  add column if not exists arquivado_por uuid references public.usuarios(id) on delete set null;

create index if not exists idx_clientes_arquivado on public.clientes (arquivado);
