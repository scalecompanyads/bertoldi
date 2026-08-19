-- Integração AASP (Associação dos Advogados de São Paulo)
-- Cada advogado pode ter uma chave individual (modo Associado).
-- A coluna aasp_chave é armazenada em texto; protegida por RLS (usuário vê só o próprio).

alter table public.usuarios
  add column if not exists aasp_chave text;

-- Permite que intimacoes armazene publicações da AASP além do DJEN.
-- comunica_id (DJEN) era NOT NULL unique; agora é nullable para acomodar fontes alternativas.
alter table intimacoes
  alter column comunica_id drop not null;

alter table intimacoes
  add column if not exists aasp_id    bigint,
  add column if not exists fonte      text not null default 'djen';

-- Índice único por aasp_id (somente onde preenchido — publicações AASP)
create unique index if not exists intimacoes_aasp_id_key
  on intimacoes (aasp_id)
  where aasp_id is not null;

-- Índice para filtrar por fonte
create index if not exists idx_intimacoes_fonte on intimacoes (fonte);
