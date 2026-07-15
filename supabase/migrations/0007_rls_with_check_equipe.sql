-- Garante INSERT/UPDATE explícitos nas policies da equipe (evita bloqueio silencioso)

drop policy if exists "equipe: acesso total a clientes" on clientes;
create policy "equipe: acesso total a clientes" on clientes
  for all
  using (public.is_equipe())
  with check (public.is_equipe());

drop policy if exists "equipe: acesso total a servicos" on servicos_contratados;
create policy "equipe: acesso total a servicos" on servicos_contratados
  for all
  using (public.is_equipe())
  with check (public.is_equipe());

drop policy if exists "equipe: acesso total a processos" on processos;
create policy "equipe: acesso total a processos" on processos
  for all
  using (public.is_equipe())
  with check (public.is_equipe());

drop policy if exists "equipe: acesso total a linha_do_tempo" on linha_do_tempo;
create policy "equipe: acesso total a linha_do_tempo" on linha_do_tempo
  for all
  using (public.is_equipe())
  with check (public.is_equipe());

drop policy if exists "equipe: acesso total a documentos" on documentos;
create policy "equipe: acesso total a documentos" on documentos
  for all
  using (public.is_equipe())
  with check (public.is_equipe());

drop policy if exists "equipe: acesso total a observacoes" on observacoes;
create policy "equipe: acesso total a observacoes" on observacoes
  for all
  using (public.is_equipe())
  with check (public.is_equipe());

drop policy if exists "equipe: acesso total a verificacoes_datajud" on verificacoes_datajud;
create policy "equipe: acesso total a verificacoes_datajud" on verificacoes_datajud
  for all
  using (public.is_equipe())
  with check (public.is_equipe());

drop policy if exists "equipe: acesso total a comunicados" on comunicados;
create policy "equipe: acesso total a comunicados" on comunicados
  for all
  using (public.is_equipe())
  with check (public.is_equipe());
