-- Vincula clientes pelo e-mail quando uma conta Auth de cliente é criada (convite)

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

  if papel_final = 'cliente' then
    update public.clientes
    set usuario_id = new.id
    where usuario_id is null
      and email is not null
      and lower(trim(email)) = lower(trim(new.email));
  end if;

  return new;
end;
$$;

alter function public.handle_new_user() owner to postgres;
