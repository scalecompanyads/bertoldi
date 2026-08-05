-- Público-alvo do comunicado: clientes, advogados ou ambos (todos)

create type publico_comunicado as enum ('clientes', 'advogados', 'todos');

alter table public.comunicados
  add column if not exists publico publico_comunicado not null default 'clientes';

create table if not exists public.comunicado_destinatarios_usuario (
  comunicado_id uuid not null references public.comunicados(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  lido_em timestamptz,
  email_enviado_em timestamptz,
  criado_em timestamptz not null default now(),
  primary key (comunicado_id, usuario_id)
);

create index if not exists idx_comunicado_dest_usuario_nao_lidos
  on public.comunicado_destinatarios_usuario (usuario_id, criado_em desc)
  where lido_em is null;

alter table public.comunicado_destinatarios_usuario enable row level security;

drop policy if exists "equipe: acesso total a destinatarios usuario comunicados"
  on public.comunicado_destinatarios_usuario;
create policy "equipe: acesso total a destinatarios usuario comunicados"
  on public.comunicado_destinatarios_usuario
  for all
  using (public.is_equipe())
  with check (public.is_equipe());

drop policy if exists "usuario: leitura dos proprios comunicados equipe"
  on public.comunicado_destinatarios_usuario;
create policy "usuario: leitura dos proprios comunicados equipe"
  on public.comunicado_destinatarios_usuario
  for select
  using (usuario_id = auth.uid());

drop policy if exists "usuario: marcar proprio comunicado equipe lido"
  on public.comunicado_destinatarios_usuario;
create policy "usuario: marcar proprio comunicado equipe lido"
  on public.comunicado_destinatarios_usuario
  for update
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());
