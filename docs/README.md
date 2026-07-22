# Documentação do projeto — guia de leitura

Este diretório contém o planejamento, a rastreabilidade e a operação da Plataforma Oficial
do Escritório.

## Ordem de leitura recomendada

0. **APRESENTACAO_CLIENTE.md** — documento para apresentar ao cliente: funcionalidades,
   fluxos, limitações honestas e o que ainda não entra no entregável
1. **STACK.md** — qual tecnologia usar e por quê, estrutura de pastas, diretrizes de design
   system (acessibilidade, dark/light, tipografia)
2. **MODELO_DE_DADOS.md** — tabelas, campos, relações e regras de RLS. Usar como base direta
   para escrever as migrations do Supabase
3. **ROADMAP.md** — fases de desenvolvimento, do setup básico ao MVP avançado, cada uma com
   critério de pronto. Seguir a ordem das fases — cada uma depende da anterior
4. **MATRIZ_REQUISITOS.md** — status, papel responsável e evidência verificável de cada
   capacidade entregue
5. **RUNBOOK_OPERACAO.md** — rotina diária, fluxos críticos, incidentes e checklist de deploy
6. **NOTAS_TECNICAS.md** — fontes, timestamps, cache, cobertura e limites das consultas
7. **BACKLOG_FASE2.md** — itens pedidos pelo cliente mas conscientemente adiados por
   complexidade/custo. Não implementar agora, mas não descartar — manter como referência para
   quando o MVP estiver em produção e o escritório quiser evoluir
8. **prototipo-consulta-tribunal.html** — protótipo funcional feito pelo próprio cliente, que
   identifica o tribunal competente a partir do número CNJ e abre a página de consulta
   pública correta. Contém a tabela de mapeamento (`CMAP`) e lista de tribunais (`TRIBS`) que
   devem ser portadas para `/lib/cnj-parser` na Fase 3 do roadmap — não reescrever essa lógica
   do zero, ela já funciona e foi validada pelo cliente

## Contexto de negócio (resumo)

Escritório de advocacia com atuação nacional, ~3 a 5 mil processos ativos. Já vendeu o
projeto ao cliente por um valor abaixo do ideal para o escopo completo solicitado, então a
estratégia é entregar em fases: um MVP funcional e honesto em 2-3 semanas (Fases 0 a 2 do
roadmap, no mínimo), com o restante das fases sendo construído de forma incremental depois,
sem prometer ao cliente final algo que não será entregue no prazo combinado.

Pontos de atenção recorrentes nas conversas com o cliente, que devem ser respeitados durante
a implementação:

- A "consulta automática de andamentos" usa a API pública do Datajud do CNJ — gratuita, mas
  com lag de atualização e cobertura variável por tribunal. Isso deve ficar visível na
  interface (timestamp da última verificação, origem automática/manual), não escondido.
- Visibilidade de dados ao cliente é sempre opt-in (documento, evento de linha do tempo e
  observação só aparecem para o cliente se explicitamente marcados como visíveis pela
  equipe).
- O visual precisa ser de fácil leitura e uso tanto para advogados quanto para clientes
  leigos em tecnologia — priorizar clareza sobre densidade de informação, especialmente na
  área do cliente.
