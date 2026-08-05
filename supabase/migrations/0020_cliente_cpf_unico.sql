-- CPF único por cliente: deduplica registros existentes e impede novos duplicados.

create or replace function public.cpf_digits(val text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(val, ''), '[^0-9]', '', 'g');
$$;

-- Mescla clientes com o mesmo CPF antes de criar o índice único.
-- Mantém o registro com mais processos; em empate, o que já tem login.
do $$
declare
  grupo record;
  keeper_id uuid;
  loser_id uuid;
  loser_usuario uuid;
  loser_email text;
  loser_telefone text;
  loser_nome text;
begin
  for grupo in
    select public.cpf_digits(cpf_cnpj) as doc
    from public.clientes
    where length(public.cpf_digits(cpf_cnpj)) = 11
    group by public.cpf_digits(cpf_cnpj)
    having count(*) > 1
  loop
    select c.id into keeper_id
    from public.clientes c
    left join public.processos p on p.cliente_id = c.id
    where public.cpf_digits(c.cpf_cnpj) = grupo.doc
    group by c.id, c.usuario_id, c.criado_em
    order by count(p.id) desc, (c.usuario_id is not null) desc, c.criado_em asc
    limit 1;

    for loser_id in
      select c.id
      from public.clientes c
      where public.cpf_digits(c.cpf_cnpj) = grupo.doc
        and c.id <> keeper_id
    loop
      select usuario_id, email, telefone, nome
      into loser_usuario, loser_email, loser_telefone, loser_nome
      from public.clientes
      where id = loser_id;

      update public.clientes k
      set
        usuario_id = coalesce(k.usuario_id, loser_usuario),
        email = coalesce(nullif(trim(k.email), ''), nullif(trim(loser_email), '')),
        telefone = coalesce(nullif(trim(k.telefone), ''), nullif(trim(loser_telefone), '')),
        nome = case
          when length(trim(coalesce(loser_nome, ''))) > length(trim(k.nome)) then loser_nome
          else k.nome
        end,
        cpf_cnpj = grupo.doc,
        atualizado_em = now()
      where k.id = keeper_id;

      update public.processos set cliente_id = keeper_id where cliente_id = loser_id;

      if to_regclass('public.servicos_contratados') is not null then
        update public.servicos_contratados set cliente_id = keeper_id where cliente_id = loser_id;
      end if;

      if to_regclass('public.comunicados') is not null then
        update public.comunicados set cliente_id = keeper_id where cliente_id = loser_id;
      end if;

      if to_regclass('public.comunicado_destinatarios') is not null then
        delete from public.comunicado_destinatarios cd
        where cd.cliente_id = loser_id
          and exists (
            select 1
            from public.comunicado_destinatarios existente
            where existente.comunicado_id = cd.comunicado_id
              and existente.cliente_id = keeper_id
          );

        update public.comunicado_destinatarios
        set cliente_id = keeper_id
        where cliente_id = loser_id;
      end if;

      delete from public.clientes where id = loser_id;
    end loop;
  end loop;
end $$;

-- Normaliza CPFs existentes para só dígitos (11 chars)
update public.clientes
set cpf_cnpj = public.cpf_digits(cpf_cnpj)
where cpf_cnpj is not null
  and length(public.cpf_digits(cpf_cnpj)) = 11
  and cpf_cnpj <> public.cpf_digits(cpf_cnpj);

alter table public.clientes
  add column if not exists cpf_digits text
  generated always as (public.cpf_digits(cpf_cnpj)) stored;

create unique index if not exists idx_clientes_cpf_digits_unique
  on public.clientes (cpf_digits)
  where length(cpf_digits) = 11;

create or replace function public.get_cliente_por_cpf(cpf_input text)
returns table (id uuid, nome text)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.nome
  from public.clientes c
  where c.cpf_digits = public.cpf_digits(cpf_input)
    and length(public.cpf_digits(cpf_input)) = 11
  limit 1;
$$;

alter function public.get_cliente_por_cpf(text) owner to postgres;

create or replace function public.get_cliente_auth_email(cpf_input text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select u.email
  from public.clientes c
  inner join public.usuarios u on u.id = c.usuario_id
  where c.cpf_digits = public.cpf_digits(cpf_input)
    and length(public.cpf_digits(cpf_input)) = 11
    and c.usuario_id is not null
    and u.papel = 'cliente'
  limit 1;
$$;

alter function public.get_cliente_auth_email(text) owner to postgres;
