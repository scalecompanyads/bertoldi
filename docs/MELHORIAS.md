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
- Configuração: `RESEND_API_KEY` e `EMAIL_FROM` (ver `.env.example`); domínio precisa estar
  verificado no Resend para entregar a terceiros

### ⬜ 1.3 Prazos com alerta escalonado — PENDENTE

O que é: transformar intimação em tarefa com prazo contado e alerta visual/por e-mail.
Completa o ciclo intimação → prazo → tarefa. Junto com 1.1 e 1.2, forma o argumento
"nenhum prazo passa em branco".

Como fazer:
- O kanban de tarefas já tem campo `prazo` — falta o cálculo: contagem em dias úteis exige
  tabela de feriados nacionais + estaduais (avaliar API BrasilAPI `/feriados` ou tabela local)
- Ao criar tarefa a partir da intimação, sugerir prazo (o advogado confirma — contagem de
  prazo processual é decisão jurídica, nunca automática silenciosa)
- Alerta visual no painel: verde > 5 dias, amarelo 2–5, vermelho < 2
- E-mail "prazo vence amanhã" (reaproveitar `lib/email`)
- Esforço estimado: ~2 dias

---

## Dor nº 2 — Adoção: ninguém vai cadastrar 3.000 processos à mão

### ⬜ 2.1 Importação em massa — PENDENTE (crítico para entrar em produção)

O que é: upload de CSV/planilha (número CNJ + CPF do cliente + tipo de serviço) criando
clientes e processos em lote.

Como fazer:
- Tela de upload no admin com prévia e validação linha a linha (CNJ válido, CPF válido)
- Para cada linha, o Datajud preenche automaticamente classe, assunto, vara e data de
  ajuizamento (a infra da capa já existe em `lib/datajud`)
- Processar em lotes com pausa (a API do Datajud é lenta — 30s+ por consulta em índices
  grandes); considerar fila simples via tabela + cron em vez de processar no request
- Esforço estimado: ~2 dias

### ⬜ 2.2 Auto-preenchimento da capa no cadastro individual — PENDENTE

O que é: digitou o CNJ no formulário → botão "Buscar dados do tribunal" preenche assunto,
vara, data de ajuizamento e cidade.

Como fazer: chamar `consultarDatajud` no `processo-form` (a capa já vem pronta); mapear
`capa.assuntos` → `assunto`, `capa.orgaoJulgador` → `vara_orgao`, `capa.dataAjuizamento` →
`data_ajuizamento`. Esforço: ~meio dia.

---

## Dor nº 3 — O cliente que liga toda semana perguntando "e meu processo?"

### ⬜ 3.1 Tradução de juridiquês — PENDENTE

O que é: "Conclusos para despacho" não significa nada para o cliente. Exibir versão simples
para o cliente, técnica para o advogado.

Como fazer: os movimentos do Datajud vêm com código nacional padronizado (TPU/CNJ) — manter
tabela de-para dos ~50 códigos mais comuns em `lib/` (ex: código 51 "Conclusão" → "O processo
está com o juiz para análise"). O código do movimento já chega em `DatajudMovimento.codigo`;
hoje só o nome é usado. Esforço: ~1 dia — alto impacto na percepção de cuidado.

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

### ⬜ 4.2 Painel "visão do dia" — PENDENTE

O que é: a home do admin priorizada por urgência — intimações não lidas, prazos da semana,
processos com movimentação nova desde ontem.

Como fazer: reescrever `/admin/page.tsx` com 3 blocos de consulta (intimações `nao_lida`,
tarefas com prazo < 7 dias, verificações com `houve_movimentacao` nas últimas 24h).
Esforço: ~1 dia.

### ⬜ 4.3 Agenda de audiências — PENDENTE

O que é: tabela `audiencias` (data/hora, tipo, local ou link de vídeo, processo) com
lembrete por e-mail e exportação ICS para Google Calendar.

Como fazer: o Datajud não traz audiências de forma confiável — cadastro manual, mas
centralizado. Migration + CRUD + rota `/api/ics` gerando o arquivo. Lembrete via cron
existente. Esforço: ~1,5 dia.

### ⬜ 4.4 Auditoria — PENDENTE

O que é: tabela `logs_auditoria` (quem alterou o quê e quando) — o escritório precisa disso
quando algo dá errado. Hoje só há `atualizado_por`/`atualizado_em` em campos sensíveis.

Como fazer: trigger `after update` nas tabelas sensíveis (processos, documentos,
linha_do_tempo) gravando diff em jsonb, + tela de consulta no admin. Esforço: ~1 dia.

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

| # | Item | Esforço | Por quê nessa ordem |
|---|------|---------|---------------------|
| 1 | 2.1 Importação em massa | ~2 dias | Sem ela o sistema não entra em produção de verdade |
| 2 | 1.3 Prazos com alerta | ~2 dias | Completa o ciclo intimação → prazo → tarefa |
| 3 | 2.2 Capa no cadastro | ~0,5 dia | Ganho rápido, infra pronta |
| 4 | 3.1 Tradução de juridiquês | ~1 dia | Reduz ligações; cliente se sente cuidado |
| 5 | 4.2 Painel visão do dia | ~1 dia | Urgência visível ao abrir o sistema |
| 6 | 4.3 Agenda de audiências | ~1,5 dia | Centraliza o que hoje vive no Google Calendar |
| 7 | 4.4 Auditoria | ~1 dia | Importa quando o volume de uso crescer |

---

## Configuração única no deploy (depois disso, o escritório toca sozinho)

1. Migrations `0012` e `0013` no SQL Editor do Supabase
2. Variáveis na Vercel: `DATAJUD_API_KEY` (chave pública da wiki do CNJ), `RESEND_API_KEY`,
   `EMAIL_FROM` (domínio verificado no Resend) — ver `.env.example`
3. OAB dos advogados: pela própria plataforma, em **Equipe**
