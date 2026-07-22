-- Auditoria (item 4.4 do MELHORIAS.md): quem alterou o quê e quando.
-- Trigger after update/delete nas tabelas sensíveis grava o diff em jsonb.
-- Consulta pela tela /admin/auditoria (restrita a admins).

create table logs_auditoria (
  id          uuid        primary key default gen_random_uuid(),
  tabela      text        not null,
  registro_id uuid        not null,
  -- auth.uid() é null quando a alteração veio de rotina automática (service role)
  usuario_id  uuid,
  acao        text        not null check (acao in ('update', 'delete')),
  -- { campo: { de: valor_antigo, para: valor_novo } } — só os campos alterados
  diff        jsonb       not null,
  criado_em   timestamptz not null default now()
);

create index idx_logs_auditoria_data on logs_auditoria (criado_em desc);
create index idx_logs_auditoria_registro on logs_auditoria (tabela, registro_id);

alter table logs_auditoria enable row level security;

-- Só admins consultam; ninguém insere/edita via API (o trigger roda como definer)
create policy "admin: leitura de logs_auditoria" on logs_auditoria
  for select using (
    exists (
      select 1 from usuarios u where u.id = auth.uid() and u.papel = 'admin'
    )
  );

create or replace function public.fn_log_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_diff jsonb := '{}'::jsonb;
  v_old jsonb;
  v_new jsonb;
  k text;
begin
  if tg_op = 'DELETE' then
    insert into logs_auditoria (tabela, registro_id, usuario_id, acao, diff)
    values (tg_table_name, old.id, auth.uid(), 'delete', to_jsonb(old));
    return old;
  end if;

  v_old := to_jsonb(old);
  v_new := to_jsonb(new);

  for k in select jsonb_object_keys(v_new) loop
    if v_old -> k is distinct from v_new -> k then
      v_diff := v_diff || jsonb_build_object(k, jsonb_build_object('de', v_old -> k, 'para', v_new -> k));
    end if;
  end loop;

  -- Nada mudou de fato (update redundante) → não polui o log
  if v_diff = '{}'::jsonb then
    return new;
  end if;

  insert into logs_auditoria (tabela, registro_id, usuario_id, acao, diff)
  values (tg_table_name, new.id, auth.uid(), 'update', v_diff);

  return new;
end;
$$;

alter function public.fn_log_auditoria() owner to postgres;

create trigger trg_auditoria_processos
  after update or delete on processos
  for each row execute function public.fn_log_auditoria();

create trigger trg_auditoria_documentos
  after update or delete on documentos
  for each row execute function public.fn_log_auditoria();

create trigger trg_auditoria_linha_do_tempo
  after update or delete on linha_do_tempo
  for each row execute function public.fn_log_auditoria();

create trigger trg_auditoria_clientes
  after update or delete on clientes
  for each row execute function public.fn_log_auditoria();
