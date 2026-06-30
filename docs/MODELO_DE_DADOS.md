# Modelo de dados — referência para migrations

Este documento detalha as tabelas principais do banco (Postgres via Supabase), incluindo
campos, tipos sugeridos e notas de RLS. Serve de referência para o Claude Code gerar as
migrations reais — os tipos e nomes podem ser ajustados durante a implementação, mas a
estrutura relacional e as regras de visibilidade devem ser preservadas.

## Convenções gerais

- Toda tabela tem `id uuid primary key default gen_random_uuid()`
- Toda tabela tem `criado_em timestamptz default now()`
- Tabelas editáveis pela equipe têm `atualizado_em timestamptz default now()` e
  `atualizado_por uuid references usuarios(id)`, atualizados via trigger ou na própria
  Server Action
- Campos booleanos de visibilidade seguem o padrão `visivel_cliente boolean default false`
  (visibilidade é opt-in, nunca opt-out — mais seguro por padrão)

---

## `usuarios`

Representa qualquer pessoa com login no sistema (equipe ou cliente). Vinculado ao
`auth.users` do Supabase Auth via `id` compartilhado.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | mesmo id do `auth.users` |
| nome | text | |
| email | text | único |
| papel | enum | `admin`, `advogado`, `secretaria`, `cliente` |

**RLS**: usuário só lê/edita o próprio registro, exceto `admin`, que lê todos.

---

## `clientes`

Dados cadastrais de cada cliente do escritório. Um cliente pode ou não ter usuário/login
vinculado (a equipe pode cadastrar o cliente antes de liberar o acesso).

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| usuario_id | uuid, nullable | referencia `usuarios(id)`, nulo até o login ser criado |
| nome | text | |
| cpf_cnpj | text | indexado, usado na busca do painel admin |
| telefone | text | nullable |
| email | text | nullable |

**RLS**: equipe (admin, advogado, secretaria) lê/edita todos. Cliente lê apenas o próprio
registro (`usuario_id = auth.uid()`).

**Índices**: `cpf_cnpj` e `nome` (busca textual — considerar `pg_trgm` para busca parcial
eficiente dado o volume de 3-5 mil registros).

---

## `servicos_contratados`

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| cliente_id | uuid | referencia `clientes(id)` |
| tipo_servico | text | |
| data_contratacao | date | |
| status | enum | `ativo`, `concluido`, `cancelado` |

**RLS**: equipe lê/edita todos. Cliente lê apenas os próprios (via `cliente_id` → `clientes.
usuario_id = auth.uid()`).

---

## `processos`

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| cliente_id | uuid | referencia `clientes(id)` |
| responsavel_id | uuid, nullable | referencia `usuarios(id)`, advogado responsável |
| numero_cnj | text, nullable | formato `NNNNNNN-DD.AAAA.J.TT.OOOO`, nulo até ser distribuído |
| tribunal | text, nullable | preenchido automaticamente a partir do `numero_cnj` (Fase 3) |
| vara_orgao | text, nullable | |
| tipo_servico | text | pode referenciar `servicos_contratados` ou ser livre |
| status_interno | enum | livre conforme fluxo do escritório, ex: `triagem`, `em_analise`, `distribuido`, `em_andamento`, `concluido` |
| data_contratacao | date | |
| atualizado_por | uuid, nullable | |
| atualizado_em | timestamptz, nullable | |

**RLS**: equipe lê/edita todos. Cliente lê apenas os próprios (via `cliente_id`).

---

## `linha_do_tempo`

Eventos manuais do processo (o "passo a passo" descrito no briefing original).

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| processo_id | uuid | referencia `processos(id)` |
| data_evento | date | |
| descricao | text | |
| visivel_cliente | boolean | default false |
| criado_por | uuid | referencia `usuarios(id)` |

**RLS**: equipe lê/edita todos os eventos de qualquer processo. Cliente lê apenas eventos do
próprio processo **com `visivel_cliente = true`**.

---

## `documentos`

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| processo_id | uuid | referencia `processos(id)` |
| nome_arquivo | text | |
| url_storage | text | caminho no Supabase Storage |
| tipo | enum | `contrato`, `peticao`, `procuracao`, `comprovante`, `decisao`, `outro` |
| visivel_cliente | boolean | default false |
| enviado_por | uuid | referencia `usuarios(id)` |

**RLS**: equipe lê/edita todos. Cliente lê apenas documentos do próprio processo com
`visivel_cliente = true`. Aplicar RLS também no bucket do Storage, não só na tabela.

---

## `observacoes`

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| processo_id | uuid | referencia `processos(id)` |
| texto | text | |
| visivel_cliente | boolean | default false |
| autor_id | uuid | referencia `usuarios(id)` |

**RLS**: mesma lógica de `linha_do_tempo` e `documentos`.

---

## `verificacoes_datajud` (Fase 4)

Histórico de toda consulta feita ao Datajud para um processo, automática ou manual.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| processo_id | uuid | referencia `processos(id)` |
| verificado_em | timestamptz | |
| origem | enum | `automatica`, `manual` |
| houve_movimentacao | boolean | resultado da comparação com a verificação anterior |
| ultimo_andamento | text, nullable | texto/resumo retornado pela API |
| raw_response | jsonb, nullable | resposta completa da API, para debug futuro |

**RLS**: somente equipe lê. Cliente não acessa diretamente esta tabela (a equipe decide o que
vira evento na `linha_do_tempo` visível).

**Uso na interface**: sempre buscar o registro mais recente por `processo_id` (
`order by verificado_em desc limit 1`) para exibir "última verificação: [data] ([origem])" na
tela do advogado.

---

## `comunicados` (Fase 5)

Mensagens gerais do escritório para o cliente, não ligadas a um processo específico.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| cliente_id | uuid, nullable | nulo = comunicado para todos os clientes |
| titulo | text | |
| mensagem | text | |
| enviado_em | timestamptz | |
| lido | boolean | default false — nota: se for comunicado em massa, considerar tabela de junção `comunicado_lido (comunicado_id, cliente_id)` em vez de campo único, para rastrear leitura por cliente individualmente |

**RLS**: cliente lê apenas comunicados destinados a ele (`cliente_id = próprio` ou
`cliente_id is null`). Equipe lê/cria todos.

---

## Notas sobre o parsing do número CNJ (Fase 3)

A lógica já existe no protótipo HTML enviado pelo cliente e deve ser portada, não
reescrita do zero. Resumo da estrutura do número (padrão Resolução CNJ 65/2008):

```
NNNNNNN-DD.AAAA.J.TT.OOOO
│        │   │   │  │   └─ órgão/vara
│        │   │   │  └───── tribunal (2 dígitos)
│        │   │   └──────── segmento de justiça (1 dígito)
│        │   └──────────── ano de ajuizamento
│        └──────────────── dígito verificador
└───────────────────────── número sequencial
```

A chave de mapeamento usada no protótipo (`segmento + tribunal`, 3 caracteres) para
descobrir o tribunal competente deve ser migrada para `/lib/cnj-parser` como uma constante
TypeScript tipada, reaproveitando a tabela `CMAP` e a lista `TRIBS` (com nome, sigla e URL de
consulta pública) já presentes no arquivo original.
