-- Auditoria: registra inclusões, identifica autor quando service role grava atualizado_por,
-- e estende cobertura a audiências e observações.

alter table public.logs_auditoria
  drop constraint if exists logs_auditoria_acao_check;

alter table public.logs_auditoria
  add constraint logs_auditoria_acao_check
  check (acao in ('insert', 'update', 'delete'));

create index if not exists idx_logs_auditoria_usuario on public.logs_auditoria (usuario_id, criado_em desc);

create or replace function public.fn_auditoria_usuario_id(registro jsonb)
returns uuid
language sql
immutable
as $$
  select coalesce(
    nullif(trim(registro->>'atualizado_por'), '')::uuid,
    nullif(trim(registro->>'criado_por'), '')::uuid,
    nullif(trim(registro->>'enviado_por'), '')::uuid,
    nullif(trim(registro->>'autor_id'), '')::uuid
  );
$$;

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
  v_usuario uuid;
  k text;
begin
  if tg_op = 'DELETE' then
    v_usuario := coalesce(auth.uid(), fn_auditoria_usuario_id(to_jsonb(old)));
    insert into logs_auditoria (tabela, registro_id, usuario_id, acao, diff)
    values (tg_table_name, old.id, v_usuario, 'delete', to_jsonb(old));
    return old;
  end if;

  v_new := to_jsonb(new);
  v_usuario := coalesce(auth.uid(), fn_auditoria_usuario_id(v_new));

  if tg_op = 'INSERT' then
    insert into logs_auditoria (tabela, registro_id, usuario_id, acao, diff)
    values (tg_table_name, new.id, v_usuario, 'insert', v_new);
    return new;
  end if;

  v_old := to_jsonb(old);

  for k in select jsonb_object_keys(v_new) loop
    if v_old -> k is distinct from v_new -> k then
      v_diff := v_diff || jsonb_build_object(
        k,
        jsonb_build_object('de', v_old -> k, 'para', v_new -> k)
      );
    end if;
  end loop;

  if v_diff = '{}'::jsonb then
    return new;
  end if;

  insert into logs_auditoria (tabela, registro_id, usuario_id, acao, diff)
  values (tg_table_name, new.id, v_usuario, 'update', v_diff);

  return new;
end;
$$;

alter function public.fn_log_auditoria() owner to postgres;

-- Recria triggers com INSERT
drop trigger if exists trg_auditoria_processos on public.processos;
create trigger trg_auditoria_processos
  after insert or update or delete on public.processos
  for each row execute function public.fn_log_auditoria();

drop trigger if exists trg_auditoria_documentos on public.documentos;
create trigger trg_auditoria_documentos
  after insert or update or delete on public.documentos
  for each row execute function public.fn_log_auditoria();

drop trigger if exists trg_auditoria_linha_do_tempo on public.linha_do_tempo;
create trigger trg_auditoria_linha_do_tempo
  after insert or update or delete on public.linha_do_tempo
  for each row execute function public.fn_log_auditoria();

drop trigger if exists trg_auditoria_clientes on public.clientes;
create trigger trg_auditoria_clientes
  after insert or update or delete on public.clientes
  for each row execute function public.fn_log_auditoria();

drop trigger if exists trg_auditoria_audiencias on public.audiencias;
create trigger trg_auditoria_audiencias
  after insert or update or delete on public.audiencias
  for each row execute function public.fn_log_auditoria();

drop trigger if exists trg_auditoria_observacoes on public.observacoes;
create trigger trg_auditoria_observacoes
  after insert or update or delete on public.observacoes
  for each row execute function public.fn_log_auditoria();

drop trigger if exists trg_auditoria_calendarios on public.calendarios_forenses;
create trigger trg_auditoria_calendarios
  after insert or update or delete on public.calendarios_forenses
  for each row execute function public.fn_log_auditoria();

drop trigger if exists trg_auditoria_calendario_versoes on public.calendario_forense_versoes;
create trigger trg_auditoria_calendario_versoes
  after insert or update or delete on public.calendario_forense_versoes
  for each row execute function public.fn_log_auditoria();

drop trigger if exists trg_auditoria_calendario_dias on public.calendario_forense_dias;
create trigger trg_auditoria_calendario_dias
  after insert or update or delete on public.calendario_forense_dias
  for each row execute function public.fn_log_auditoria();
