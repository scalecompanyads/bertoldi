-- Kanban pessoal de tarefas por advogado. Uso estritamente individual:
-- cada usuário da equipe só enxerga e gerencia as próprias tarefas.

create type status_tarefa as enum ('a_fazer', 'em_andamento', 'aguardando', 'concluido');

create table tarefas (
  id           uuid          primary key default gen_random_uuid(),
  usuario_id   uuid          not null references usuarios(id) on delete cascade,
  processo_id  uuid          references processos(id) on delete set null,
  titulo       text          not null,
  descricao    text,
  status       status_tarefa not null default 'a_fazer',
  prazo        timestamptz,
  ordem        int           not null default 0,
  concluida_em timestamptz,
  criado_em    timestamptz   not null default now()
);

create index idx_tarefas_usuario on tarefas (usuario_id, status, ordem);
create index idx_tarefas_prazo on tarefas (usuario_id, prazo) where prazo is not null;

alter table tarefas enable row level security;

-- Só o dono, e só se for da equipe (cliente não tem tarefas)
create policy "dono: acesso total às próprias tarefas" on tarefas
  for all
  using (
    usuario_id = auth.uid()
    and exists (
      select 1 from usuarios u where u.id = auth.uid()
        and u.papel in ('admin', 'advogado', 'secretaria')
    )
  )
  with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from usuarios u where u.id = auth.uid()
        and u.papel in ('admin', 'advogado', 'secretaria')
    )
  );
