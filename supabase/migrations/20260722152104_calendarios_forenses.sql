create table public.calendarios_forenses (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  escopo text not null check (escopo in ('estadual', 'municipal', 'tribunal', 'comarca')),
  uf char(2) not null check (uf = upper(uf)),
  comarca text,
  tribunal text,
  ativo boolean not null default true,
  versao_ativa_id uuid,
  criado_em timestamptz not null default now(),
  criado_por uuid references public.usuarios(id) on delete set null
);

create table public.calendario_forense_versoes (
  id uuid primary key default gen_random_uuid(),
  calendario_id uuid not null references public.calendarios_forenses(id) on delete cascade,
  versao integer not null check (versao > 0),
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado', 'substituido')),
  vigencia_inicio date not null,
  vigencia_fim date not null,
  fonte_url text not null,
  fonte_descricao text not null,
  criado_em timestamptz not null default now(),
  criado_por uuid references public.usuarios(id) on delete set null,
  publicado_em timestamptz,
  publicado_por uuid references public.usuarios(id) on delete set null,
  unique (calendario_id, versao),
  check (vigencia_fim >= vigencia_inicio),
  check (
    (status = 'rascunho' and publicado_em is null)
    or (status in ('publicado', 'substituido') and publicado_em is not null)
  )
);

alter table public.calendarios_forenses
  add constraint calendarios_versao_ativa_fk
  foreign key (versao_ativa_id) references public.calendario_forense_versoes(id) on delete set null;

create table public.calendario_forense_dias (
  id uuid primary key default gen_random_uuid(),
  versao_id uuid not null references public.calendario_forense_versoes(id) on delete cascade,
  data_inicio date not null,
  data_fim date not null,
  tipo text not null check (tipo in ('feriado_estadual', 'feriado_municipal', 'recesso', 'suspensao', 'ponto_facultativo')),
  descricao text not null,
  criado_em timestamptz not null default now(),
  unique (versao_id, data_inicio, data_fim, descricao),
  check (data_fim >= data_inicio)
);

create index idx_calendarios_localidade
  on public.calendarios_forenses (uf, escopo, ativo);
create index idx_calendario_versoes_calendario
  on public.calendario_forense_versoes (calendario_id, versao desc);
create index idx_calendario_dias_versao_data
  on public.calendario_forense_dias (versao_id, data_inicio, data_fim);

alter table public.processos
  add column calendario_forense_id uuid references public.calendarios_forenses(id) on delete set null;

alter table public.tarefas
  add column prazo_contexto jsonb;

alter table public.calendarios_forenses enable row level security;
alter table public.calendario_forense_versoes enable row level security;
alter table public.calendario_forense_dias enable row level security;

create policy "equipe: leitura de calendarios" on public.calendarios_forenses
  for select using (public.is_equipe());
create policy "admin: gestao de calendarios" on public.calendarios_forenses
  for all using (public.is_admin()) with check (public.is_admin());

create policy "equipe: leitura de versoes de calendario" on public.calendario_forense_versoes
  for select using (public.is_equipe());
create policy "admin: gestao de versoes de calendario" on public.calendario_forense_versoes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "equipe: leitura de dias de calendario" on public.calendario_forense_dias
  for select using (public.is_equipe());
create policy "admin: gestao de dias de calendario" on public.calendario_forense_dias
  for all using (public.is_admin()) with check (public.is_admin());

create function public.fn_proteger_versao_calendario()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'rascunho' then
      raise exception 'Versões publicadas são imutáveis; crie uma nova versão.';
    end if;
    return old;
  end if;
  if old.status <> 'rascunho' then
    if old.status = 'publicado'
       and new.status = 'substituido'
       and (to_jsonb(new) - 'status') = (to_jsonb(old) - 'status') then
      return new;
    end if;
    raise exception 'Versões publicadas são imutáveis; crie uma nova versão.';
  end if;
  return new;
end;
$$;

create function public.fn_proteger_dia_calendario()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_versao_id uuid := coalesce(new.versao_id, old.versao_id);
begin
  if exists (
    select 1 from public.calendario_forense_versoes
    where id = v_versao_id and status <> 'rascunho'
  ) then
    raise exception 'Dias de uma versão publicada são imutáveis.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke execute on function public.fn_proteger_versao_calendario() from public, anon, authenticated;
revoke execute on function public.fn_proteger_dia_calendario() from public, anon, authenticated;

create trigger trg_proteger_versao_calendario
  before update or delete on public.calendario_forense_versoes
  for each row execute function public.fn_proteger_versao_calendario();
create trigger trg_proteger_dia_calendario
  before update or delete on public.calendario_forense_dias
  for each row execute function public.fn_proteger_dia_calendario();

create trigger trg_auditoria_calendarios
  after update or delete on public.calendarios_forenses
  for each row execute function public.fn_log_auditoria();
create trigger trg_auditoria_calendario_versoes
  after update or delete on public.calendario_forense_versoes
  for each row execute function public.fn_log_auditoria();
create trigger trg_auditoria_calendario_dias
  after update or delete on public.calendario_forense_dias
  for each row execute function public.fn_log_auditoria();
