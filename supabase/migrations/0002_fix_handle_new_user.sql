-- Corrige falha ao criar usuário no Auth ("Database error creating new user").
-- Causas comuns: search_path ausente na função security definer e cast inválido do enum papel.

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

  return new;
end;
$$;

-- Garante owner com permissão para bypass de RLS via security definer
alter function public.handle_new_user() owner to postgres;
