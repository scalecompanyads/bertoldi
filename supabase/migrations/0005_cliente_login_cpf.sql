-- Lookup de e-mail por CPF para login de clientes (chamado via service role no servidor)

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
  where regexp_replace(coalesce(c.cpf_cnpj, ''), '[^0-9]', '', 'g') = regexp_replace(cpf_input, '[^0-9]', '', 'g')
    and length(regexp_replace(cpf_input, '[^0-9]', '', 'g')) = 11
    and c.usuario_id is not null
    and u.papel = 'cliente'
  limit 1;
$$;

alter function public.get_cliente_auth_email(text) owner to postgres;

-- Índice para acelerar busca por CPF normalizado
create index if not exists idx_clientes_cpf_digits
  on public.clientes (regexp_replace(coalesce(cpf_cnpj, ''), '[^0-9]', '', 'g'));
