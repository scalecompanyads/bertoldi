-- Impede que usuários alterem o próprio papel (auto-promoção)
drop policy if exists "usuario: edição própria" on usuarios;

create policy "usuario: edição própria" on usuarios
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and papel = (select u.papel from usuarios u where u.id = auth.uid())
  );

-- Admin pode alterar qualquer usuário (incluindo papel)
create policy "admin: edição de usuarios" on usuarios
  for update
  using (
    exists (
      select 1 from usuarios u where u.id = auth.uid() and u.papel = 'admin'
    )
  );
