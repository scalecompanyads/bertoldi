# Roadmap — Plataforma Oficial do Escritório

Este roadmap cobre o escopo completo combinado com o cliente, organizado em fases
incrementais. Cada fase entrega algo funcional e testável — não é uma divisão arbitrária de
tarefas soltas. Itens marcados como (Fase 2 / complexo) estão registrados aqui para não serem
esquecidos, mas detalhados de verdade em `BACKLOG_FASE2.md`.

---

## Fase 0 — Fundação técnica

Objetivo: ambiente rodando, banco modelado, autenticação funcionando. Nada de tela bonita
ainda — é a base que todo o resto depende.

- [ ] Setup do projeto Next.js (App Router, TypeScript, Tailwind, shadcn/ui)
- [ ] Setup do projeto Supabase (banco, auth, storage)
- [ ] Modelagem do banco de dados (ver `MODELO_DE_DADOS.md`)
- [ ] Configuração de Row Level Security (RLS) básica: cliente só vê seus próprios dados,
      equipe vê tudo
- [ ] Autenticação: login de cliente e login de equipe (papéis: admin, advogado, secretária)
- [ ] Deploy inicial na Vercel (ambiente de staging)
- [ ] Configuração de dark/light mode (`next-themes` + tokens shadcn)

**Critério de pronto**: é possível criar um usuário de teste (cliente e equipe), logar com
cada um, e confirmar que RLS bloqueia acesso cruzado entre clientes.

---

## Fase 1 — Painel interno básico (equipe)

Objetivo: a equipe consegue cadastrar e gerenciar tudo manualmente, mesmo sem nenhuma
automação ainda. Esta fase é pré-requisito para a área do cliente ter o que mostrar.

- [ ] Tela de listagem de clientes com busca por nome ou CPF/CNPJ
- [ ] Tela de ficha do cliente (dados cadastrais, edição inline)
- [ ] Cadastro de processo vinculado a um cliente (número CNJ, tribunal, vara, status,
      responsável, data de contratação)
- [ ] Tela de detalhe do processo
- [ ] Linha do tempo manual (adicionar/editar/remover eventos, toggle visível ao cliente)
- [ ] Upload de documentos vinculados ao processo, com toggle de visibilidade ao cliente
      (Supabase Storage + RLS)
- [ ] Observações internas (não visíveis ao cliente) e observações públicas (visíveis)
- [ ] Cadastro de serviços contratados por cliente (tipo de serviço, data, status)
- [ ] Rastreabilidade simples: campos `atualizado_por` e `atualizado_em` em edições
      sensíveis (status do processo, número CNJ)

**Critério de pronto**: um advogado consegue, sozinho, cadastrar um cliente do zero, vincular
um processo, montar a linha do tempo do exemplo do briefing original, anexar um documento e
decidir o que fica visível.

---

## Fase 2 — Área do cliente

Objetivo: o cliente loga e vê o que a equipe cadastrou na Fase 1, com boa experiência mobile.

- [ ] Login do cliente (Supabase Auth)
- [ ] Tela inicial da área do cliente: lista de processos/serviços vinculados
- [ ] Detalhe do processo: linha do tempo (somente itens marcados como visíveis), número do
      processo, status atual
- [ ] Listagem de documentos liberados pelo escritório, com download
- [ ] Observações públicas visíveis na tela do processo
- [ ] Perfil do cliente: dados cadastrais + lista de serviços contratados

**Critério de pronto**: o cliente de teste consegue logar pelo celular e ver exatamente o
cenário de exemplo do briefing original (contratação → triagem → análise → distribuição),
sem ver nada marcado como interno.

---

## Fase 3 — Identificação de tribunal e atalho de consulta manual

Objetivo: reaproveitar a lógica já prototipada pelo cliente (arquivo HTML enviado), agora
integrada ao cadastro de processo.

- [ ] Migrar a tabela de mapeamento CNJ → tribunal e a lógica de parsing do número CNJ para
      `/lib/cnj-parser`
- [ ] Ao cadastrar/visualizar um processo, identificar automaticamente o tribunal competente
      a partir do número CNJ
- [ ] Botão "Abrir no portal do tribunal": copia o número e abre a página de consulta pública
      correta (reaproveitando as URLs já mapeadas no protótipo)
- [ ] Exibir essa informação tanto na tela do advogado quanto, opcionalmente, na do cliente

**Critério de pronto**: ao colar um número CNJ válido, o sistema mostra corretamente o
tribunal e abre a página certa ao clicar no botão — replicando o comportamento do protótipo
HTML original, agora integrado ao resto da plataforma.

---

## Fase 4 — Integração automática com o Datajud (CNJ)

Objetivo: verificação automática de movimentações, com transparência sobre quando a última
verificação aconteceu.

- [ ] Cliente de integração com a API pública do Datajud (`/lib/datajud`)
- [ ] Tabela `verificacoes_datajud`: registra cada consulta (automática ou manual), se houve
      movimentação nova, e o conteúdo encontrado
- [ ] Cron job (Vercel Cron ou Supabase Edge Function + pg_cron) rodando periodicamente,
      consultando o Datajud para cada processo ativo
- [ ] Botão "Verificar agora" na tela do processo (consulta manual, sob demanda)
- [ ] Exibição clara, na tela do advogado, de "última verificação: [data/hora] — [automática /
      manual]"
- [ ] Quando uma movimentação nova é encontrada, sinalizar visualmente no painel (ex: badge
      "nova movimentação") para o advogado revisar e, se quiser, transcrever para a linha do
      tempo do cliente
- [ ] Comunicar claramente na interface (tooltip ou texto de apoio) que a atualização do
      Datajud não é instantânea e depende do tribunal de origem

**Critério de pronto**: um processo de teste com número CNJ real mostra resultado da consulta
ao Datajud, com timestamp da última verificação visível, e o botão de verificação manual
funciona sob demanda.

**Nota de risco**: ver `BACKLOG_FASE2.md` para as limitações de cobertura e lag de
atualização do Datajud — isso deve ser comunicado ao cliente antes desta fase, não depois.

---

## Fase 5 — Notificações e comunicados

Objetivo: o escritório consegue avisar o cliente sobre novidades, com opção de ligar/desligar
por processo.

- [ ] Campo de configuração por processo: "notificar cliente em caso de atualização?
      (sim/não)"
- [ ] Envio de e-mail (via Resend ou similar) quando uma movimentação é confirmada e marcada
      como visível ao cliente
- [ ] Tabela e tela de "comunicados": mensagens gerais do escritório para o cliente (não
      ligadas a um processo específico), com status lido/não lido
- [ ] Painel de notificações dentro da área do cliente (sino/contador de não lidos)

**Critério de pronto**: ao marcar uma linha do tempo como visível com notificação ativada, o
cliente de teste recebe um e-mail; um comunicado geral aparece na área do cliente como não
lido até ele abrir.

---

## Fase 6 — Site institucional

Objetivo: presença pública do escritório. Construída por último de propósito — é a parte de
menor complexidade técnica e maior componente de conteúdo/design, então não trava o
desenvolvimento das partes funcionais.

- [ ] Página inicial
- [ ] Sobre o escritório
- [ ] Áreas de atuação
- [ ] Equipe
- [ ] Contato (formulário seguro, sem expor e-mail diretamente)
- [ ] Política de privacidade
- [ ] Link de acesso para login do cliente e da equipe

**Critério de pronto**: site público no ar, responsivo, com SEO básico (meta tags, título por
página) e formulário de contato funcional.

---

## Fase 7 — Polimento, acessibilidade e revisão geral

Objetivo: passar o pente fino antes de considerar o MVP avançado pronto para uso real.

- [ ] Auditoria de acessibilidade (contraste, navegação por teclado, leitor de tela) em todas
      as telas principais
- [ ] Revisão de responsividade mobile em toda a área do cliente
- [ ] Testes de carga básicos simulando volume real (3 a 5 mil processos) na busca e
      listagem — checar performance de queries e índices no Postgres
- [ ] Revisão de mensagens de erro e estados vazios (ex: cliente sem processos ainda)
- [ ] Documentação mínima de uso para a equipe interna (como cadastrar processo, como marcar
      visibilidade, como interpretar o status do Datajud)

**Critério de pronto**: o sistema está pronto para os primeiros usuários reais da equipe do
escritório usarem em produção.

---

## O que NÃO entra neste roadmap (ver `BACKLOG_FASE2.md`)

Os itens abaixo foram mencionados pelo cliente, mas exigem complexidade, custo recorrente ou
risco técnico desproporcional ao MVP. Estão documentados em detalhe, não descartados:

- Consulta automática ilimitada em todos os tribunais sem as limitações do Datajud
  (cobertura/lag)
- Notificação via WhatsApp
- Upload de documentos pelo cliente
- Dashboard avançado com relatórios e métricas
- Aplicativo mobile nativo
- Níveis de permissão granulares além de admin/advogado/secretária/cliente
- Sincronização em tempo real multiusuário (tipo Google Docs) na edição do painel
