-- O cliente precisa ler as verificações dos próprios processos para ver
-- os andamentos consultados no portal e o indicador de novidade.
-- Até aqui só a equipe tinha acesso, então a área do cliente recebia vazio.

create policy "cliente: leitura de verificacoes dos próprios processos" on verificacoes_datajud
  for select using (
    exists (
      select 1 from processos p
        join clientes c on c.id = p.cliente_id
        where p.id = processo_id and c.usuario_id = auth.uid()
    )
  );
