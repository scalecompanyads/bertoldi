-- Agenda de audiências (item 4.3 do MELHORIAS.md).
-- O Datajud não traz audiências de forma confiável — cadastro manual, mas
-- centralizado na plataforma, com lembrete por e-mail e exportação ICS.

create type tipo_audiencia as enum ('conciliacao', 'instrucao', 'julgamento', 'una', 'justificacao', 'outra');

create table audiencias (
  id           uuid           primary key default gen_random_uuid(),
  processo_id  uuid           references processos(id) on delete cascade,
  tipo         tipo_audiencia not null default 'outra',
  data_hora    timestamptz    not null,
  -- Local físico (fórum/sala) ou link de videoconferência — pelo menos um
  local        text,
  link_video   text,
  observacoes  text,
  criado_por   uuid           references usuarios(id) on delete set null,
  criado_em    timestamptz    not null default now(),
  atualizado_em timestamptz
);

create index idx_audiencias_data on audiencias (data_hora);
create index idx_audiencias_processo on audiencias (processo_id) where processo_id is not null;

alter table audiencias enable row level security;

-- Agenda é do escritório inteiro — cliente não vê
create policy "equipe: acesso total a audiencias" on audiencias
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
