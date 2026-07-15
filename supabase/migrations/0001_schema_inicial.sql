-- ============================================================
-- ENUMS
-- ============================================================
create type papel_usuario as enum ('admin', 'advogado', 'secretaria', 'cliente');
create type status_processo as enum ('triagem', 'em_analise', 'distribuido', 'em_andamento', 'concluido');
create type status_servico as enum ('ativo', 'concluido', 'cancelado');
create type tipo_documento as enum ('contrato', 'peticao', 'procuracao', 'comprovante', 'decisao', 'outro');
create type origem_verificacao as enum ('automatica', 'manual');

-- ============================================================
-- USUARIOS
-- Vinculado ao auth.users via id compartilhado
-- ============================================================
create table usuarios (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text        not null,
  email      text        not null unique,
  papel      papel_usuario not null default 'cliente',
  criado_em  timestamptz not null default now()
);

alter table usuarios enable row level security;

-- Usuário lê/edita apenas o próprio registro
create policy "usuario: leitura própria" on usuarios
  for select using (auth.uid() = id);

create policy "usuario: edição própria" on usuarios
  for update using (auth.uid() = id);

-- Admin lê todos
create policy "admin: leitura total de usuarios" on usuarios
  for select using (
    exists (
      select 1 from usuarios u where u.id = auth.uid() and u.papel = 'admin'
    )
  );

-- ============================================================
-- CLIENTES
-- ============================================================
create table clientes (
  id          uuid        primary key default gen_random_uuid(),
  usuario_id  uuid        references usuarios(id) on delete set null,
  nome        text        not null,
  cpf_cnpj    text,
  telefone    text,
  email       text,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz,
  atualizado_por uuid references usuarios(id) on delete set null
);

create index idx_clientes_cpf_cnpj on clientes(cpf_cnpj);
create index idx_clientes_nome on clientes using gin(to_tsvector('portuguese', nome));

alter table clientes enable row level security;

create policy "equipe: acesso total a clientes" on clientes
  for all using (
    exists (
      select 1 from usuarios u where u.id = auth.uid()
        and u.papel in ('admin', 'advogado', 'secretaria')
    )
  );

create policy "cliente: leitura própria" on clientes
  for select using (usuario_id = auth.uid());

-- ============================================================
-- SERVICOS_CONTRATADOS
-- ============================================================
create table servicos_contratados (
  id               uuid        primary key default gen_random_uuid(),
  cliente_id       uuid        not null references clientes(id) on delete cascade,
  tipo_servico     text        not null,
  data_contratacao date        not null,
  status           status_servico not null default 'ativo',
  criado_em        timestamptz not null default now()
);

alter table servicos_contratados enable row level security;

create policy "equipe: acesso total a servicos" on servicos_contratados
  for all using (
    exists (
      select 1 from usuarios u where u.id = auth.uid()
        and u.papel in ('admin', 'advogado', 'secretaria')
    )
  );

create policy "cliente: leitura própria de servicos" on servicos_contratados
  for select using (
    exists (
      select 1 from clientes c where c.id = cliente_id and c.usuario_id = auth.uid()
    )
  );

-- ============================================================
-- PROCESSOS
-- ============================================================
create table processos (
  id               uuid        primary key default gen_random_uuid(),
  cliente_id       uuid        not null references clientes(id) on delete cascade,
  responsavel_id   uuid        references usuarios(id) on delete set null,
  numero_cnj       text,
  tribunal         text,
  vara_orgao       text,
  tipo_servico     text        not null,
  status_interno   status_processo not null default 'triagem',
  data_contratacao date        not null,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz,
  atualizado_por   uuid        references usuarios(id) on delete set null
);

alter table processos enable row level security;

create policy "equipe: acesso total a processos" on processos
  for all using (
    exists (
      select 1 from usuarios u where u.id = auth.uid()
        and u.papel in ('admin', 'advogado', 'secretaria')
    )
  );

create policy "cliente: leitura própria de processos" on processos
  for select using (
    exists (
      select 1 from clientes c where c.id = cliente_id and c.usuario_id = auth.uid()
    )
  );

-- ============================================================
-- LINHA_DO_TEMPO
-- ============================================================
create table linha_do_tempo (
  id               uuid        primary key default gen_random_uuid(),
  processo_id      uuid        not null references processos(id) on delete cascade,
  data_evento      date        not null,
  descricao        text        not null,
  visivel_cliente  boolean     not null default false,
  criado_por       uuid        not null references usuarios(id) on delete restrict,
  criado_em        timestamptz not null default now()
);

alter table linha_do_tempo enable row level security;

create policy "equipe: acesso total a linha_do_tempo" on linha_do_tempo
  for all using (
    exists (
      select 1 from usuarios u where u.id = auth.uid()
        and u.papel in ('admin', 'advogado', 'secretaria')
    )
  );

create policy "cliente: leitura de eventos visíveis" on linha_do_tempo
  for select using (
    visivel_cliente = true
    and exists (
      select 1 from processos p
        join clientes c on c.id = p.cliente_id
        where p.id = processo_id and c.usuario_id = auth.uid()
    )
  );

-- ============================================================
-- DOCUMENTOS
-- ============================================================
create table documentos (
  id               uuid        primary key default gen_random_uuid(),
  processo_id      uuid        not null references processos(id) on delete cascade,
  nome_arquivo     text        not null,
  url_storage      text        not null,
  tipo             tipo_documento not null default 'outro',
  visivel_cliente  boolean     not null default false,
  enviado_por      uuid        not null references usuarios(id) on delete restrict,
  criado_em        timestamptz not null default now()
);

alter table documentos enable row level security;

create policy "equipe: acesso total a documentos" on documentos
  for all using (
    exists (
      select 1 from usuarios u where u.id = auth.uid()
        and u.papel in ('admin', 'advogado', 'secretaria')
    )
  );

create policy "cliente: leitura de documentos visíveis" on documentos
  for select using (
    visivel_cliente = true
    and exists (
      select 1 from processos p
        join clientes c on c.id = p.cliente_id
        where p.id = processo_id and c.usuario_id = auth.uid()
    )
  );

-- ============================================================
-- OBSERVACOES
-- ============================================================
create table observacoes (
  id               uuid        primary key default gen_random_uuid(),
  processo_id      uuid        not null references processos(id) on delete cascade,
  texto            text        not null,
  visivel_cliente  boolean     not null default false,
  autor_id         uuid        not null references usuarios(id) on delete restrict,
  criado_em        timestamptz not null default now()
);

alter table observacoes enable row level security;

create policy "equipe: acesso total a observacoes" on observacoes
  for all using (
    exists (
      select 1 from usuarios u where u.id = auth.uid()
        and u.papel in ('admin', 'advogado', 'secretaria')
    )
  );

create policy "cliente: leitura de observacoes visíveis" on observacoes
  for select using (
    visivel_cliente = true
    and exists (
      select 1 from processos p
        join clientes c on c.id = p.cliente_id
        where p.id = processo_id and c.usuario_id = auth.uid()
    )
  );

-- ============================================================
-- VERIFICACOES_DATAJUD (Fase 4)
-- ============================================================
create table verificacoes_datajud (
  id                uuid        primary key default gen_random_uuid(),
  processo_id       uuid        not null references processos(id) on delete cascade,
  verificado_em     timestamptz not null default now(),
  origem            origem_verificacao not null,
  houve_movimentacao boolean    not null default false,
  ultimo_andamento  text,
  raw_response      jsonb
);

alter table verificacoes_datajud enable row level security;

create policy "equipe: acesso total a verificacoes_datajud" on verificacoes_datajud
  for all using (
    exists (
      select 1 from usuarios u where u.id = auth.uid()
        and u.papel in ('admin', 'advogado', 'secretaria')
    )
  );

-- ============================================================
-- COMUNICADOS (Fase 5)
-- ============================================================
create table comunicados (
  id          uuid        primary key default gen_random_uuid(),
  cliente_id  uuid        references clientes(id) on delete cascade,
  titulo      text        not null,
  mensagem    text        not null,
  enviado_em  timestamptz not null default now(),
  lido        boolean     not null default false
);

alter table comunicados enable row level security;

create policy "equipe: acesso total a comunicados" on comunicados
  for all using (
    exists (
      select 1 from usuarios u where u.id = auth.uid()
        and u.papel in ('admin', 'advogado', 'secretaria')
    )
  );

create policy "cliente: leitura de comunicados próprios" on comunicados
  for select using (
    cliente_id is null
    or exists (
      select 1 from clientes c where c.id = cliente_id and c.usuario_id = auth.uid()
    )
  );

-- ============================================================
-- FUNÇÃO: sincroniza usuarios ao criar conta no Auth
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  papel_informado text := nullif(trim(new.raw_user_meta_data->>'papel'), '');
  papel_final papel_usuario := 'cliente';
begin
  if papel_informado in ('admin', 'advogado', 'secretaria', 'cliente') then
    papel_final := papel_informado::papel_usuario;
  end if;

  insert into public.usuarios (id, nome, email, papel)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'nome'), ''), split_part(new.email, '@', 1)),
    new.email,
    papel_final
  );

  return new;
end;
$$;

alter function public.handle_new_user() owner to postgres;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
