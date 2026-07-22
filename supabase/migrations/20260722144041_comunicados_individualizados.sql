-- A leitura e o envio de e-mail pertencem ao destinatário, não ao comunicado.
-- Isso evita que um cliente marque um comunicado global como lido para todos.
create table comunicado_destinatarios (
  comunicado_id uuid not null references comunicados(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  lido_em timestamptz,
  email_enviado_em timestamptz,
  criado_em timestamptz not null default now(),
  primary key (comunicado_id, cliente_id)
);

create index idx_comunicado_destinatarios_cliente_nao_lidos
  on comunicado_destinatarios (cliente_id, criado_em desc)
  where lido_em is null;

alter table comunicado_destinatarios enable row level security;

create policy "equipe: acesso total a destinatarios de comunicados"
  on comunicado_destinatarios
  for all
  using (public.is_equipe())
  with check (public.is_equipe());

create policy "cliente: leitura dos próprios comunicados"
  on comunicado_destinatarios
  for select
  using (
    exists (
      select 1
      from clientes c
      where c.id = cliente_id
        and c.usuario_id = auth.uid()
    )
  );

-- Preserva comunicados anteriores à migration. Comunicados globais históricos
-- são materializados para clientes ativos; os individuais mantêm seu destinatário.
insert into comunicado_destinatarios (comunicado_id, cliente_id, lido_em, criado_em)
select
  co.id,
  c.id,
  case when co.cliente_id is not null and co.lido then co.enviado_em else null end,
  co.enviado_em
from comunicados co
join clientes c
  on c.id = co.cliente_id
  or (co.cliente_id is null and c.arquivado = false)
on conflict (comunicado_id, cliente_id) do nothing;

comment on column comunicados.lido is
  'Legado: leitura individual fica em comunicado_destinatarios.lido_em.';
