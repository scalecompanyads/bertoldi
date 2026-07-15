-- Notificação por e-mail ao cliente quando um andamento visível é publicado.
-- Desligada por padrão: o escritório ativa por processo, conscientemente.

alter table public.processos
  add column if not exists notificar_cliente boolean not null default false;
