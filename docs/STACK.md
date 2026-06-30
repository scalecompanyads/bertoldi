# Stack — Plataforma Oficial do Escritório

## Visão geral

Monorepo único (Next.js full-stack) cobrindo site institucional, área do cliente e painel
interno do escritório. Banco, autenticação e storage de arquivos resolvidos pelo Supabase,
sem necessidade de backend separado. Deploy na Vercel.

## Stack principal

| Camada | Tecnologia | Por quê |
|---|---|---|
| Framework | Next.js (App Router) | Front + API routes + Server Actions no mesmo projeto |
| Linguagem | TypeScript | Tipagem reduz bugs em CRUD com muitos campos |
| UI / componentes | shadcn/ui + Tailwind CSS + Radix UI | Componentes acessíveis por padrão (ARIA, navegação por teclado, foco), dark/light mode nativo via CSS variables, código vive no projeto (editável pelo Claude Code) |
| Banco de dados | Supabase (Postgres) | Relacional, RLS para controle de visibilidade por linha |
| Autenticação | Supabase Auth | Login de cliente e de equipe prontos, sem implementar do zero |
| Storage de arquivos | Supabase Storage | Upload de documentos com controle de acesso via RLS |
| Hospedagem | Vercel | Deploy contínuo, cron jobs nativos para a varredura do Datajud |
| Consulta processual automática | API pública Datajud (CNJ) | Gratuita, oficial, cobre ~91 tribunais (cobertura completa varia por tribunal — ver NOTAS_TECNICAS.md) |
| Atalho de consulta manual | Lógica de identificação de tribunal por número CNJ (já prototipada pelo cliente) | Reaproveitar tabela de mapeamento CNJ → tribunal + URLs de consulta pública |
| Notificação por e-mail | Resend (ou similar) | Simples de integrar com Next.js, camada gratuita suficiente para MVP |

## Por que essa combinação

- **Supabase resolve as três partes mais demoradas de construir do zero**: autenticação,
  controle de acesso a arquivos e banco relacional. Isso é o que torna viável entregar o
  escopo completo em poucas semanas.
- **shadcn/ui** não é uma biblioteca importada como dependência fechada — o código de cada
  componente é copiado para dentro do projeto. Isso significa que o Claude Code consegue ler,
  entender e ajustar qualquer componente livremente, sem ficar limitado a uma API de props
  fixa de uma lib de terceiros.
- **Radix UI** (base do shadcn) já resolve acessibilidade por padrão: navegação por teclado,
  ARIA roles corretos, gerenciamento de foco em modais/dropdowns. Isso atende diretamente o
  requisito de acessibilidade sem trabalho extra de implementação.
- **Dark/light mode** via `next-themes` + CSS variables do Tailwind é praticamente
  configuração, não desenvolvimento — ver seção de design system abaixo.

## Estrutura de pastas sugerida (monorepo único)

```
/app
  /(public)          → site institucional (home, sobre, áreas de atuação, contato)
  /(cliente)          → área restrita do cliente (login, processos, documentos)
  /(admin)            → painel interno (equipe: admin, advogado, secretária)
  /api                → rotas de API (ex: cron do Datajud, webhooks)
/components
  /ui                 → componentes shadcn (botão, input, card, etc.)
  /shared             → componentes reutilizados entre áreas
/lib
  /supabase           → clients e helpers do Supabase
  /datajud             → integração com a API do CNJ
  /cnj-parser          → lógica de parsing do número CNJ + mapeamento de tribunais
/docs                  → este conjunto de documentos (não entra em produção)
```

## Design system — diretrizes práticas

- **Tipografia**: usar uma fonte sans-serif legível e neutra (ex: Inter ou similar já
  otimizada para tela), tamanho base mínimo de 16px no corpo de texto, evitar peso de fonte
  abaixo de 400 para texto corrido.
- **Contraste**: todas as combinações de cor/fundo devem atingir no mínimo AA do WCAG 2.1
  (contraste 4.5:1 para texto normal, 3:1 para texto grande). O shadcn já usa tokens de cor
  que facilitam manter isso consistente entre os dois temas.
- **Dark/light mode**: implementado via `next-themes`, com toggle visível no header tanto do
  site institucional quanto da área logada. Persistir preferência do usuário (localStorage ou
  preferência do sistema operacional como padrão inicial).
- **Navegação por teclado**: todo fluxo crítico (login, busca de cliente, edição inline,
  upload de documento) deve ser operável sem mouse. Isso vem majoritariamente de fábrica com
  Radix, mas exige checar manualmente os fluxos customizados (ex: busca com autocomplete).
- **Leitores de tela**: labels associados a todos os inputs, mensagens de erro anunciadas
  (`aria-live`), ícones decorativos marcados como `aria-hidden`.
- **Mobile-first**: o cliente vai acessar majoritariamente pelo celular para ver status do
  processo — priorizar essa experiência antes da versão desktop do painel admin.
