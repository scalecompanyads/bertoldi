# Melhorias — pensadas a partir das dores reais de um escritório de advocacia

Este documento reúne as melhorias levantadas em julho/2026 para levar a plataforma de "painel
de acompanhamento" a ferramenta da qual o escritório não consegue mais viver sem. Está
organizado por dor (não por tecnologia), com o status e o caminho técnico de cada item.

Princípio do projeto: **autossuficiência** — o escritório administra tudo pela própria
plataforma, sem tocar no Supabase, na Vercel ou no código.

---

## Dor nº 1 — Perder prazo (risco de responsabilidade civil do advogado)

Movimentação processual é *informação*; intimação é *obrigação com prazo correndo*. É aqui
que o sistema gera mais valor.

### ✅ 1.1 Monitor de intimações via DJEN/Comunica — IMPLEMENTADO

O que é: cron diário busca na API pública do Comunica (`comunicaapi.pje.jus.br`) tudo que foi
publicado no DJEN em nome de cada advogado do escritório (por número OAB), em todos os
tribunais de uma vez, com texto integral — dado do mesmo dia, sem o lag do Datajud.

Como foi feito:
- Migration `0012`: campos `oab_numero`/`oab_uf` em `usuarios` + tabela `intimacoes`
  (dedup por `comunica_id`, RLS restrita à equipe)
- `lib/djen/`: cliente da API com paginação
- Cron `/api/cron/djen` (dias úteis, 7h BRT, 5 dias retroativos para cobrir fins de semana)
- Vínculo automático ao processo cadastrado pelo número CNJ; sem cadastro, alerta
  "processo não cadastrado no sistema"
- Tela `/admin/intimacoes`: filtros por status, íntegra expansível, link para o documento
  no portal, ações "marcar como lida" e "criar tarefa"

### ✅ 1.2 Notificações por e-mail (Resend) — IMPLEMENTADO

O que é: sem notificação, nada do resto é visto. Digest (resumo agrupado) em vez de um
e-mail por evento — advogado odeia spam.

Como foi feito:
- `lib/email/`: cliente HTTP do Resend, sem SDK; sem `RESEND_API_KEY`, envios são pulados
  silenciosamente (o sistema nunca quebra por causa de e-mail)
- Digest de intimações por advogado, ao fim de cada sincronização do DJEN
- Digest de movimentações por advogado responsável (processos sem responsável vão para os
  admins), ao fim do cron do Datajud
- Aviso ao cliente quando um andamento visível é publicado — controlado pelo toggle
  "Notificar cliente por e-mail" na ficha do processo (migration `0013`, desligado por padrão)
- Comunicados globais ou individuais materializam um destinatário por cliente; leitura e
  badge são independentes, e o e-mail usa chave idempotente por comunicado/cliente
  (migration `20260722144041`)
- Configuração: `RESEND_API_KEY` e `EMAIL_FROM` (ver `.env.example`); domínio precisa estar
  verificado no Resend para entregar a terceiros

### ✅ 1.3 Prazos com alerta escalonado — IMPLEMENTADO

O que é: transformar intimação em tarefa com prazo contado e alerta visual/por e-mail.
Completa o ciclo intimação → prazo → tarefa. Junto com 1.1 e 1.2, forma o argumento
"nenhum prazo passa em branco".

Como foi feito:
- `lib/prazos/`: dias úteis com tabela local de feriados nacionais (fixos + móveis pela
  Páscoa/Meeus) — sem dependência de API externa. Feriados estaduais/municipais e recessos
  vêm de calendários forenses versionados cadastrados pelo escritório; a data sugerida
  continua sendo confirmada pelo advogado antes de salvar
- `/admin/calendarios`: admin cria rascunho com fonte oficial, adiciona dias/intervalos,
  publica versão imutável e vincula o calendário ao processo
- "Criar tarefa" na intimação abre diálogo: prazo em dias úteis (padrão 15) + vencimento
  calculado na sistemática do CPC (publicação no 1º dia útil após a disponibilização,
  início no dia útil seguinte, só dias úteis) — data editável, ou "criar sem prazo";
  exibe versão, fonte e ocorrências locais aplicadas
- Kanban: cor do prazo por dias úteis restantes (verde > 5, amarelo 2–5, vermelho < 2 ou
  vencido), com rótulo "restam N dias úteis" e metadados de `prazo_contexto`
- Cron `/api/cron/prazos` (dias úteis, 7h BRT): digest por membro da equipe com tarefas
  vencidas, vencendo hoje e vencendo no próximo dia útil, via `lib/email`

---

## Dor nº 2 — Adoção: ninguém vai cadastrar 3.000 processos à mão

### ✅ 2.1 Importação em massa — IMPLEMENTADO

O que é: upload de CSV/planilha (número CNJ + CPF do cliente + nome + tipo de serviço)
criando clientes e processos em lote.

Como foi feito:
- Migration `0014`: tabela `fila_capa` (fila de preenchimento da capa, RLS restrita à equipe)
- Tela `/admin/importar`: colar ou subir CSV (separador `;`, `,` ou tab, cabeçalho opcional),
  prévia com validação linha a linha (formato CNJ, dígito verificador do CPF), resultado por
  linha após a importação e status da fila com botão "Processar fila agora"
- `lib/actions/importacao.ts`: reaproveita cliente pelo CPF/CNPJ ou cria; pula processo com
  CNJ já cadastrado; tribunal identificado pelo próprio número; limite de 500 linhas por lote
- Capa via fila + cron (`/api/cron/importacao`, de hora em hora, orçamento de tempo): a API do
  Datajud é lenta demais para rodar no request. Preenche assunto, vara e data de ajuizamento,
  e grava a verificação-baseline para o cron diário detectar movimentações desde a importação

### ✅ 2.2 Auto-preenchimento da capa no cadastro individual — IMPLEMENTADO

O que é: digitou o CNJ no formulário → botão "Buscar dados do tribunal" preenche assunto,
vara/órgão e data de ajuizamento.

Como foi feito: action `buscarCapaTribunal` em `lib/actions/datajud.ts` (restrita à equipe;
identifica o tribunal pelo número e avisa quando não há cobertura no Datajud) + botão no
`processo-form` ao lado do badge do tribunal. Os campos preenchidos ficam editáveis — o
advogado confere antes de salvar. Cidade não vem na API pública; segue manual.

---

## Dor nº 3 — O cliente que liga toda semana perguntando "e meu processo?"

### ✅ 3.1 Tradução de juridiquês — IMPLEMENTADO

O que é: "Conclusos para despacho" não significa nada para o cliente. Exibir versão simples
para o cliente, técnica para o advogado.

Como foi feito: `lib/tpu.ts` com de-para de ~50 códigos TPU/CNJ + fallback por nome do
movimento (cobre verificações antigas gravadas sem código). O código passou a ser propagado
em `Movimento.codigo` (lib/datajud). Na tela do cliente, a linha do tempo mostra a versão
simples como texto principal e o registro técnico do tribunal em letra menor logo abaixo.
O advogado segue vendo só o texto técnico. Movimento sem tradução exibe o original.

### ✅ 3.2 Dados completos do processo visíveis — IMPLEMENTADO

Cartão "Dados do processo no tribunal" (classe, assuntos, órgão julgador, grau, ajuizamento,
sistema, sigilo, data de atualização pelo tribunal) nas telas do advogado e do cliente, e
movimentações com hora, órgão e complementos legíveis, histórico completo com "mostrar todas".

### ✅ 3.3 Aviso automático ao cliente — IMPLEMENTADO

Ver 1.2 — fecha o ciclo tribunal → sistema → advogado valida → cliente informado, sem
depender de ninguém lembrar de avisar.

---

## Operacional — o que o advogado sente no dia a dia

### ✅ 4.1 Gestão de equipe pela plataforma — IMPLEMENTADO

Tela `/admin/equipe` (restrita a admins): convidar membro (nome, e-mail, papel, OAB — a
pessoa define a própria senha via link), editar papel e OAB inline, remover com revogação
imediata de acesso. Travas: o escritório nunca fica sem admin; ninguém remove a si mesmo.
Aviso visual para advogado sem OAB (intimações não monitoradas).

### ✅ 4.2 Painel "visão do dia" — IMPLEMENTADO

O que é: a home do admin priorizada por urgência — intimações não lidas, prazos da semana,
processos com movimentação nova desde ontem.

Como foi feito: `/admin/page.tsx` abre com 3 blocos clicáveis lado a lado — intimações
`nao_lida` (contagem + 5 mais recentes), "Meus prazos da semana" (tarefas do usuário com
prazo em até 7 dias, coloridas pelo escalonamento de dias úteis do 1.3) e movimentações
das últimas 24h. Os KPIs e as listas que já existiam continuam logo abaixo.

### ✅ 4.3 Agenda de audiências — IMPLEMENTADO

O que é: tabela `audiencias` (data/hora, tipo, local ou link de vídeo, processo) com
lembrete por e-mail e exportação ICS para Google Calendar.

Como foi feito:
- Migration `0015`: tabela `audiencias` (tipo enum: conciliação/instrução/julgamento/una/
  justificação/outra, local e/ou link de vídeo, vínculo opcional ao processo, RLS de equipe)
- Tela `/admin/audiencias`: próximas + últimas 10 realizadas, agendar/editar/remover em diálogo
- Rota `/api/ics` (sessão de equipe): exporta a agenda como iCalendar com alarme de 1 dia
- Lembrete no cron de prazos (7h BRT, dias úteis): e-mail à equipe com as audiências de
  hoje e do próximo dia útil

### ✅ 4.4 Auditoria — IMPLEMENTADO

O que é: tabela `logs_auditoria` (quem alterou o quê e quando) — o escritório precisa disso
quando algo dá errado. Hoje só há `atualizado_por`/`atualizado_em` em campos sensíveis.

Como foi feito: migration `0016` — tabela `logs_auditoria` + trigger `after update or delete`
em processos, clientes, documentos e linha_do_tempo, gravando só os campos alterados em
jsonb `{campo: {de, para}}` (updates redundantes não geram log; `usuario_id` null indica
rotina automática). Tela `/admin/auditoria` (só admins): últimas 100 alterações com diff
expansível de/para. Leitura via RLS restrita a admin; ninguém insere pelo cliente.

### ✅ 4.5 Transparência das consultas — IMPLEMENTADO

Aviso padronizado nas áreas interna e do cliente informa a fonte, a última consulta e que a
cobertura/frequência variam por tribunal. O texto acompanha tanto o histórico automático
quanto o resultado de consultas manuais.

---

## Deliberadamente adiado (não construir agora)

- **WhatsApp** — custo por mensagem + aprovação de templates na Meta; o e-mail resolve 80%
  por custo zero. Caminho documentado em `BACKLOG_FASE2.md`.
- **Busca de processos por nome/CPF da parte** (descobrir processos novos do cliente) — a
  API pública do Datajud não expõe partes; exige API paga (Escavador, Judit, Codilo).
  Única coisa desta lista que desenvolvimento não resolve de graça.
- **Relatórios/dashboard** — sem dados acumulados vira enfeite; retomar após ~3 meses de
  uso real (ver `BACKLOG_FASE2.md`).

---

## Ordem sugerida para o que resta

Todos os itens deste documento foram implementados (julho/2026). O que segue em aberto
está em `BACKLOG_FASE2.md` (WhatsApp, busca por parte via API paga, relatórios).

---

## Configuração única no deploy (depois disso, o escritório toca sozinho)

1. Migrations `0012` a `0016` no SQL Editor do Supabase
2. Variáveis na Vercel: `DATAJUD_API_KEY` (chave pública da wiki do CNJ), `RESEND_API_KEY`,
   `EMAIL_FROM` (domínio verificado no Resend) — ver `.env.example`
3. OAB dos advogados: pela própria plataforma, em **Equipe**
