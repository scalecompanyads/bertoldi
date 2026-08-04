# Notas técnicas das consultas processuais

Revisado em 22/07/2026. Este documento explica limites operacionais que não devem ser
interpretados como garantia de cobertura nacional ou atualização em tempo real.

## Fontes

- **Datajud/CNJ:** índice público oficial consultado por `lib/datajud/`. A disponibilidade e
  a frequência com que cada tribunal envia dados variam.
- **eSAJ:** consulta direta ao portal para tribunais suportados por `lib/scrapers/esaj.ts`.
  Depende da disponibilidade e da estrutura HTML do portal.
- **Portal oficial:** fallback humano quando a consulta automática não encontra dados ou
  apresenta erro.
- **DJEN/Comunica:** fonte de intimações e comunicações oficiais; não substitui o histórico
  processual do Datajud e tem fluxo próprio em `lib/djen/`.

O roteamento atual fica em `lib/scrapers/index.ts`: tribunais eProc seguem para o Datajud;
tribunais eSAJ tentam o portal e usam Datajud como fallback; os demais usam Datajud.

## Timestamps diferentes

- `verificacoes_datajud.verificado_em`: quando a plataforma fez a consulta.
- `verificacoes_datajud.origem`: consulta automática ou manual registrada.
- `raw_response.fonte`: fonte que respondeu (`esaj` ou `datajud`).
- `capa.ultimaAtualizacao`: quando o tribunal informou ter atualizado seus próprios dados.

Esses horários não significam que o andamento acabou de ocorrer. A interface deve sempre
mostrar fonte e última consulta junto do aviso de cobertura variável e possível atraso.

## Cache

Consultas interativas reutilizam a última verificação por até 48 horas. **Forçar atualização**
ignora esse cache, mas não elimina atraso na fonte oficial. O cron também respeita a janela
para reduzir carga e indisponibilidade.

## Cobertura

A lista técnica de índices confirmados e exceções eSAJ fica em `lib/datajud/index.ts`.
Ela é uma configuração operacional, não uma promessa contratual: portais mudam, índices
podem ficar indisponíveis e tribunais podem migrar de sistema.

Quando um processo não for encontrado:

1. confira o número CNJ;
2. leia a fonte e o horário da consulta;
3. use o link para o portal oficial;
4. não conclua que o processo ou o andamento não existe apenas pelo resultado automático.

## Segurança e operação

- `DATAJUD_API_KEY` é configurada apenas no servidor.
- `SUPABASE_SERVICE_ROLE_KEY` nunca pode ser exposta em variável `NEXT_PUBLIC_*`.
- Rotas `/api/cron/*` exigem `Authorization: Bearer <CRON_SECRET>`.
- Falha de consulta ou e-mail não deve apagar o último dado válido nem bloquear o registro
  manual pela equipe.

## Crons na Vercel

O `vercel.json` do repositório usa **agendamentos diários** compatíveis com o plano **Hobby**
(gratuito). Nesse plano, expressões que rodam mais de uma vez por dia (ex.: `0 * * * *` ou
`30 * * * *`) **impedem o deploy** com o erro *Hobby accounts are limited to daily cron jobs*.

| Rota | Hobby (atual) | Pro (`vercel.cron-pro.example.json`) |
|------|---------------|--------------------------------------|
| `/api/cron/datajud` | 1×/dia útil (~8h BRT) | A cada hora em dias úteis |
| `/api/cron/djen` | 1×/dia útil (~7h BRT) | Igual |
| `/api/cron/importacao` | 1×/dia (~9h BRT) | A cada hora |
| `/api/cron/prazos` | 1×/dia útil (~10h BRT) | Igual |

Horários em **UTC** (Vercel Cron). No Hobby a execução pode variar em até ~59 min.

Para frequência maior no plano gratuito, dispare as mesmas rotas por serviço externo
(cron-job.org, GitHub Actions, etc.) com `GET` e header `Authorization: Bearer <CRON_SECRET>`.
No plano Pro, substitua o bloco `crons` do `vercel.json` pelo conteúdo de
`vercel.cron-pro.example.json`.

**Limite de duração:** rotas cron usam `maxDuration = 300` (5 min). No Hobby o teto de função
é menor (~10–60 s); jobs longos podem estourar timeout — use o botão manual correspondente
ou upgrade para Pro se a varredura completa for crítica.
