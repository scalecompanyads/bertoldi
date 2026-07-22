# Runbook de operação

Guia mínimo para operar o sistema sem acessar diretamente Supabase, Vercel ou código.
Revisado em 22/07/2026.

## Papéis

- **Administração:** usuários, clientes, importações, comunicados, agenda e auditoria.
- **Equipe jurídica:** processos, intimações, prazos, eventos e documentos.
- **Engenharia:** deploy, migrations, variáveis, crons, integrações e incidentes técnicos.

## Início e fim do dia

1. Abrir `/admin` e tratar primeiro intimações não lidas e prazos vencidos ou próximos.
2. Revisar movimentações novas antes de publicá-las ao cliente.
3. Conferir audiências do dia e do próximo dia útil.
4. Ao fim do dia, confirmar que não restam intimações sem responsável ou tarefa.

## Cadastrar e acompanhar processo

1. Abra **Clientes**, selecione o cliente e crie o processo.
2. Informe o CNJ e use **Buscar dados do tribunal**; confira a capa antes de salvar.
3. Defina o advogado responsável e se o cliente deve receber e-mail de novos eventos.
4. Em **Datajud**, leia sempre a fonte e a data da última consulta. A cobertura e o atraso
   dependem do tribunal; se necessário, use o atalho para o portal oficial.
5. Só publique na linha do tempo uma descrição que o cliente possa compreender. Marque
   **Visível ao cliente** apenas depois da revisão.

## Enviar comunicado

1. Abra `/admin/comunicados`.
2. Escolha um cliente ou **Todos os clientes (global)**.
3. Revise título e mensagem e envie uma única vez.
4. Confira no histórico o número de destinatários, leituras pendentes e e-mails enviados.
5. A leitura é individual: a ação de um cliente não altera o estado dos demais.
6. Se algum e-mail falhar, o aviso continua disponível no painel. Não recrie o comunicado
   sem antes confirmar a entrega, para não gerar uma segunda mensagem.

## Intimação e prazo

1. Abra **Intimações**, leia a íntegra e confirme o processo vinculado.
2. Se o processo tiver calendário forense publicado, a sugestão de prazo já aplica feriados
   locais e recessos cadastrados; confira a fonte e a versão no diálogo.
3. Crie a tarefa e confira manualmente o vencimento sugerido — o sistema nunca grava prazo
   sem confirmação.
4. Sem calendário local, a contagem usa só fins de semana e feriados nacionais; cadastre o
   calendário em **Calendários** quando houver fonte oficial.
5. Marque a intimação como tratada somente após atribuir a providência.

## Calendários forenses

1. Em `/admin/calendarios`, crie um rascunho com UF, escopo, vigência e URL oficial.
2. Adicione feriados, recessos ou suspensões (dia único ou intervalo).
3. Publique a versão; ela fica imutável. Para corrigir, crie uma nova versão.
4. Vincule o calendário no formulário do processo.

## Importação em massa

1. Use `/admin/importar` com no máximo 500 linhas por lote.
2. Corrija todas as linhas inválidas mostradas na prévia.
3. Depois da importação, acompanhe a fila de capa; não reenvie o mesmo lote enquanto houver
   itens pendentes.
4. Revise duplicidades e processos sem cobertura no Datajud.

## Gestão de acesso

1. Convide e remova membros somente em **Equipe**.
2. Mantenha ao menos um administrador.
3. Cadastre OAB e UF de cada advogado para habilitar o monitoramento no DJEN.
4. Ao desligar alguém, remova o acesso imediatamente e redistribua processos e tarefas.

## Incidentes e recuperação

- **Datajud/eSAJ indisponível:** consulte o portal oficial, registre o evento manualmente se
  necessário e tente novamente depois. Não interprete “não encontrado” como ausência de
  processo sem confirmar a fonte.
- **E-mail não entregue:** confirme `RESEND_API_KEY`, domínio de `EMAIL_FROM` e o e-mail do
  cliente. O painel continua sendo a fonte oficial do comunicado.
- **Cron sem executar:** Engenharia verifica logs da rota protegida e `CRON_SECRET`. Execute
  o fluxo manual correspondente apenas quando houver autorização.
- **Acesso indevido ou alteração suspeita:** remova o usuário, preserve evidências e consulte
  `/admin/auditoria` antes de corrigir dados.

## Checklist de deploy

Responsável: Engenharia.

1. Aplicar migrations pendentes, incluindo
   `20260722144041_comunicados_individualizados.sql`,
   `20260722152104_calendarios_forenses.sql` e
   `20260722152109_hardening_onda1.sql`.
2. Configurar as variáveis documentadas em `.env.example`.
3. Executar lint, `npm test` e build.
4. Validar com dois clientes de teste:
   - enviar um comunicado global;
   - confirmar dois destinatários e no máximo um e-mail para cada;
   - marcar como lido no cliente A e confirmar que B continua não lido;
   - confirmar que o badge do cliente A zera sem alterar o de B.
5. Em um processo real de teste, validar consulta manual e histórico automático nas áreas
   interna e do cliente, conferindo fonte, timestamp e aviso de cobertura/atraso.
6. (Opcional) Rodar carga isolada: `DATABASE_URL_TEST=... LOAD_TEST_CONFIRM=ISOLATED_DATABASE npm run test:load`.
7. Registrar resultado, data e responsável na entrega.
