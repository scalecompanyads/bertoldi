# Matriz de requisitos, responsáveis e evidências

Revisada em 22/07/2026. Esta matriz é a fonte de rastreabilidade do produto. “Entregue”
significa que existe evidência no repositório; validação de produção depende do runbook.

## Fase 0 — Fundação técnica

- **Projeto Next.js, TypeScript, Tailwind e shadcn — Entregue.** Responsável: Engenharia.
  Evidência: `package.json`, `app/`, `components/ui/` e `app/globals.css`.
- **Supabase, banco, Auth e Storage — Entregue.** Responsável: Engenharia. Evidência:
  `lib/supabase/`, `supabase/migrations/0001_schema_inicial.sql` e `lib/actions/documentos.ts`.
- **Modelo de dados — Entregue.** Responsável: Engenharia. Evidência:
  `docs/MODELO_DE_DADOS.md` e migrations `0001` a `0016`.
- **RLS por cliente e equipe — Entregue.** Responsável: Engenharia. Evidência: migrations
  `0001`, `0004`, `0007` e `0009`.
- **Login e papéis — Entregue.** Responsável: Engenharia. Evidência: `lib/actions/auth.ts`,
  `middleware.ts` e layouts de `app/(admin)` e `app/(cliente)`.
- **Deploy e rotinas Vercel — Entregue.** Responsável: Engenharia. Evidência: `vercel.json`
  e `.env.example`.
- **Tema claro/escuro — Entregue.** Responsável: Engenharia. Evidência:
  `components/shared/theme-provider.tsx`, `components/shared/theme-toggle.tsx` e
  `app/globals.css`.

## Fase 1 — Painel interno

- **Listagem e busca de clientes — Entregue.** Responsável: Administração do escritório.
  Evidência: `app/(admin)/admin/clientes/page.tsx`.
- **Ficha e edição de cliente — Entregue.** Responsável: Administração do escritório.
  Evidência: `app/(admin)/admin/clientes/[id]/page.tsx` e `lib/actions/clientes.ts`.
- **Cadastro e detalhe de processo — Entregue.** Responsável: Equipe jurídica. Evidência:
  `components/admin/processo-form.tsx` e
  `app/(admin)/admin/clientes/[id]/processos/[processoId]/page.tsx`.
- **Linha do tempo com visibilidade — Entregue.** Responsável: Equipe jurídica. Evidência:
  `components/admin/evento-form.tsx` e `lib/actions/linha-do-tempo.ts`.
- **Documentos com visibilidade e Storage — Entregue.** Responsável: Equipe jurídica.
  Evidência: `components/admin/documento-upload.tsx` e `lib/actions/documentos.ts`.
- **Observações internas e públicas — Entregue.** Responsável: Equipe jurídica. Evidência:
  `components/admin/observacao-form.tsx` e `lib/actions/observacoes.ts`.
- **Serviços contratados — Entregue.** Responsável: Administração do escritório. Evidência:
  ficha do cliente e `lib/actions/servicos.ts`.
- **Rastreabilidade de alterações — Entregue.** Responsável: Administração do escritório.
  Evidência: migration `0016_auditoria.sql` e `app/(admin)/admin/auditoria/page.tsx`.

## Fases 2 e 3 — Cliente e tribunais

- **Login, home, perfil e detalhe do cliente — Entregue.** Responsável: Cliente, com suporte
  da Administração. Evidência: `app/(cliente)/cliente/`.
- **Responsividade mobile da área do cliente — Entregue.** Responsável: Engenharia.
  Evidência: layouts e componentes responsivos em `app/(cliente)` e `components/cliente`.
- **Eventos, observações e documentos públicos — Entregue.** Responsável: Equipe jurídica.
  Evidência: detalhe do processo do cliente e policies RLS da migration `0001`.
- **Identificação CNJ e atalho do tribunal — Entregue.** Responsável: Engenharia. Evidência:
  `lib/cnj-parser.ts` e `components/admin/tribunal-badge.tsx`.
- **Informação do tribunal nas duas áreas — Entregue.** Responsável: Engenharia. Evidência:
  detalhes de processo em `app/(admin)` e `app/(cliente)`.

## Fase 4 — Consulta de andamentos

- **Cliente Datajud e adaptadores de tribunal — Entregue.** Responsável: Engenharia.
  Evidência: `lib/datajud/` e `lib/scrapers/`.
- **Histórico de verificações — Entregue.** Responsável: Engenharia. Evidência: tabela
  `verificacoes_datajud` na migration `0001` e policy da migration `0009`.
- **Cron periódico — Entregue.** Responsável: Engenharia. Evidência:
  `app/api/cron/datajud/route.ts` e `vercel.json`.
- **Consulta manual — Entregue.** Responsável: Equipe jurídica. Evidência:
  `components/admin/verificar-datajud-btn.tsx`,
  `components/cliente/analisar-andamento-btn.tsx` e `lib/actions/verificar-processo.ts`.
- **Timestamp, origem e alerta de novidade — Entregue.** Responsável: Equipe jurídica.
  Evidência: detalhes de processo e painel `app/(admin)/admin/page.tsx`.
- **Transparência de fonte, cobertura e atraso — Entregue.** Responsável: Engenharia.
  Evidência: `components/shared/datajud-transparencia.tsx`, usado nas consultas manuais e no
  histórico das áreas interna e do cliente.

## Fase 5 — Notificações e comunicados

- **Opt-in de e-mail por processo — Entregue.** Responsável: Equipe jurídica. Evidência:
  migration `0013_notificar_cliente.sql` e `components/admin/processo-form.tsx`.
- **E-mail de andamento publicado — Entregue.** Responsável: Equipe jurídica. Evidência:
  `lib/actions/linha-do-tempo.ts` e `lib/email/`.
- **Comunicados globais e individuais — Entregue.** Responsável: Administração do escritório.
  Evidência: páginas `admin/comunicados` e `cliente/comunicados`.
- **Leitura individual e contador por cliente — Entregue.** Responsável: Engenharia.
  Evidência: migration `20260722144041_comunicados_individualizados.sql`,
  `lib/actions/comunicados.ts`, `app/(cliente)/cliente/layout.tsx` e `cliente-nav.tsx`.
- **E-mail único por destinatário — Entregue.** Responsável: Engenharia. Evidência:
  `comunicado_destinatarios.email_enviado_em` e chave idempotente
  `comunicado/{comunicadoId}/cliente/{clienteId}` no Resend.

## Operação entregue fora do roadmap original

- **DJEN, intimações e prazos — Entregue.** Responsável: Equipe jurídica. Evidência:
  migrations `0012`, `lib/djen/`, `lib/prazos/` e rotas cron.
- **Calendários forenses locais versionados — Entregue.** Responsável: Administração do
  escritório (cadastro) + Engenharia (cálculo). Evidência:
  `20260722152104_calendarios_forenses.sql`, `/admin/calendarios`,
  `lib/prazos/calendario.ts` e diálogo de intimação com origem/fonte/ajuste manual.
- **Hardening de escala (índices + cron em lotes) — Entregue.** Responsável: Engenharia.
  Evidência: `20260722152109_hardening_onda1.sql`, `proxima_verificacao_em` e
  `scripts/onda1/load-test.mjs`.
- **Importação em massa — Entregue.** Responsável: Administração do escritório. Evidência:
  migration `0014`, `app/(admin)/admin/importar/` e `lib/importacao/`.
- **Equipe, agenda e auditoria — Entregue.** Responsável: Administração do escritório.
  Evidência: migrations `0015` e `0016` e respectivas páginas administrativas.

## Requisitos ainda pendentes

- **Site institucional — Pendente.** Responsável: Produto/Conteúdo. Próxima evidência:
  páginas públicas e formulário previstos na Fase 6 do `ROADMAP.md`.
- **Execução do teste de carga em banco isolado — Pendente de ambiente.** Responsável:
  Engenharia. Script pronto; bloqueado sem `DATABASE_URL_TEST` + `LOAD_TEST_CONFIRM`.
  Evidência do bloqueio: `docs/relatorios/onda1-carga-2026-07-22.md`.
- **Execução E2E axe autenticada — Pendente de credenciais.** Responsável: Engenharia.
  Suite em `tests/e2e/accessibility.spec.ts`; bloqueada sem `E2E_*`. Evidência:
  `docs/relatorios/onda1-a11y-2026-07-22.md`.
- **Escopo pós-MVP — Condicionado.** Responsável: Produto. Evidência da decisão e gates:
  `docs/BACKLOG_FASE2.md`.
