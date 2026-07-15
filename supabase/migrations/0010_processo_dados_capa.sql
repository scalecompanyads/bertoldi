-- Dados de capa do processo (estilo Escavador): partes, assunto,
-- valor da causa, data de ajuizamento e cidade de origem.
-- O Datajud público não expõe partes nem valor da causa, então esses
-- campos são preenchidos manualmente pela equipe.

alter table public.processos
  add column if not exists parte_autora     text,
  add column if not exists parte_re         text,
  add column if not exists outras_partes    text,
  add column if not exists assunto          text,
  add column if not exists valor_causa      numeric(14,2),
  add column if not exists data_ajuizamento date,
  add column if not exists cidade_origem    text;
