-- Corrige erro 42P17: infinite recursion detected in policy for relation "usuarios"
-- Subqueries em policies da própria tabela usuarios causam recursão no Postgres.

create or replace function public.get_my_papel()
returns papel_usuario
language sql
security definer
set search_path = public
stable
as $$
  select papel from public.usuarios where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and papel = 'admin'
  );
$$;

create or replace function public.is_equipe()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and papel in ('admin', 'advogado', 'secretaria')
  );
$$;

alter function public.get_my_papel() owner to postgres;
alter function public.is_admin() owner to postgres;
alter function public.is_equipe() owner to postgres;

-- usuarios
drop policy if exists "admin: leitura total de usuarios" on usuarios;
create policy "admin: leitura total de usuarios" on usuarios
  for select using (public.is_admin());

drop policy if exists "usuario: edição própria" on usuarios;
create policy "usuario: edição própria" on usuarios
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and papel = public.get_my_papel()
  );

drop policy if exists "admin: edição de usuarios" on usuarios;
create policy "admin: edição de usuarios" on usuarios
  for update using (public.is_admin());

-- clientes
drop policy if exists "equipe: acesso total a clientes" on clientes;
create policy "equipe: acesso total a clientes" on clientes
  for all using (public.is_equipe());

-- servicos_contratados
drop policy if exists "equipe: acesso total a servicos" on servicos_contratados;
create policy "equipe: acesso total a servicos" on servicos_contratados
  for all using (public.is_equipe());

-- processos
drop policy if exists "equipe: acesso total a processos" on processos;
create policy "equipe: acesso total a processos" on processos
  for all using (public.is_equipe());

-- linha_do_tempo
drop policy if exists "equipe: acesso total a linha_do_tempo" on linha_do_tempo;
create policy "equipe: acesso total a linha_do_tempo" on linha_do_tempo
  for all using (public.is_equipe());

-- documentos
drop policy if exists "equipe: acesso total a documentos" on documentos;
create policy "equipe: acesso total a documentos" on documentos
  for all using (public.is_equipe());

-- observacoes
drop policy if exists "equipe: acesso total a observacoes" on observacoes;
create policy "equipe: acesso total a observacoes" on observacoes
  for all using (public.is_equipe());

-- verificacoes_datajud
drop policy if exists "equipe: acesso total a verificacoes_datajud" on verificacoes_datajud;
create policy "equipe: acesso total a verificacoes_datajud" on verificacoes_datajud
  for all using (public.is_equipe());

-- comunicados
drop policy if exists "equipe: acesso total a comunicados" on comunicados;
create policy "equipe: acesso total a comunicados" on comunicados
  for all using (public.is_equipe());
