# Backlog Fase 2 — itens complexos, não priorizados, não esquecidos

Estes itens foram solicitados pelo cliente durante o levantamento de requisitos, mas exigem
esforço, custo recorrente ou risco técnico desproporcional ao escopo do MVP em 2-3 semanas.
Eles **não devem ser construídos agora**, mas devem permanecer documentados para retomada
futura — cada um com o porquê de ter sido adiado e o caminho técnico provável quando for
priorizado.

---

## 1. Consulta automática ilimitada em todos os tribunais (cobertura total + tempo real)

**O que o cliente pediu**: "como a atuação se dá em todo o território nacional e em todos os
níveis, o ideal é que não haja limitação de tribunais" + atualização automática.

**Por que não entra no MVP como pedido literalmente**: a API pública do Datajud (que entra na
Fase 4 do roadmap) já cobre os ~91 tribunais, mas com duas limitações reais:
- Lag de atualização documentado pelo próprio CNJ (~30 dias em alguns casos, varia por
  tribunal)
- Cobertura completa e consistente concentrada em uma fração dos tribunais (os de maior
  volume — TJSP, TJRJ, TJMG, TRFs, TST — têm cobertura sólida; tribunais menores podem ter
  dados parciais ou desatualizados)

**Caminho técnico quando for priorizado**: avaliar contratação de API privada comercial
(Escavador, Codilo, Judit, Vigilant, ou similar) que mantém scraping/integração direta com
cada tribunal por trás de uma API única, geralmente com webhook para notificação em tempo
real e SLA de atualização. Tem custo recorrente por processo monitorado — orçar antes de
comprometer com o cliente. Vale comparar 2-3 fornecedores nesse momento, já que preço e
cobertura mudam com frequência nesse mercado.

---

## 2. Notificação via WhatsApp

**O que o cliente pediu**: notificar cliente sobre atualizações via WhatsApp como alternativa
ao e-mail.

**Por que não entra no MVP**: WhatsApp Business API (oficial, via Meta) exige aprovação de
conta business, template de mensagem pré-aprovado para notificações fora de janela de 24h, e
geralmente um provedor intermediário (Twilio, Zenvia, etc.) com custo por mensagem. É
perfeitamente viável tecnicamente, mas é uma integração própria com processo de aprovação que
não cabe no prazo de 2-3 semanas do MVP.

**Caminho técnico quando for priorizado**: escolher provedor (avaliar custo por mensagem +
facilidade de integração com Next.js), criar e aprovar templates de mensagem junto à Meta,
implementar endpoint de envio reaproveitando o mesmo gatilho de notificação já construído
para e-mail na Fase 5.

---

## 3. Upload de documentos pelo cliente

**O que o cliente pediu**: cliente poder enviar documentos para o escritório pela plataforma,
não só receber.

**Por que não entra no MVP**: o MVP cobre upload pela equipe (Fase 1) com visibilidade
controlada. Permitir upload pelo cliente introduz questões adicionais: validação de tipo/
tamanho de arquivo, antivírus/verificação de conteúdo malicioso, fluxo de notificação para a
equipe saber que chegou um documento novo, e possível necessidade de aprovação antes do
documento ficar "oficial" no processo. Não é tecnicamente difícil, mas é superfície de
trabalho adicional que não é crítica para o problema mais urgente (visibilidade do status).

**Caminho técnico quando for priorizado**: reaproveitar a mesma infraestrutura de Supabase
Storage já usada na Fase 1, adicionando um bucket separado ou um campo `enviado_por_cliente`
na tabela de documentos, com notificação para a equipe via e-mail/painel quando um novo
arquivo chega.

---

## 4. Dashboard avançado com relatórios e métricas

**O que o cliente pediu**: implícito na conversa sobre painel administrativo robusto.

**Por que não entra no MVP**: relatórios úteis de verdade (volume de processos por status,
tempo médio de tramitação, produtividade por advogado, etc.) exigem que haja dados reais
acumulados primeiro, e exigem decisões de produto sobre quais métricas realmente importam
para o escritório — que só ficam claras depois de algumas semanas de uso real do sistema
básico.

**Caminho técnico quando for priorizado**: com o modelo de dados já existente (Fase 1-4), a
maior parte das métricas é só query agregada; pode-se usar uma lib de gráficos (ex: Recharts)
direto no painel admin sem necessidade de ferramenta de BI externa, a menos que o volume e a
complexidade de relatórios cresçam muito.

---

## 5. Aplicativo mobile nativo

**O que o cliente pediu**: app mobile como evolução futura.

**Por que não entra no MVP**: a Fase 2 (área do cliente) já é construída mobile-first e
responsiva via navegador — para a maioria dos casos de uso (ver status, ver documento,
receber notificação), isso já resolve sem o custo de manter um app nativo (App Store + Google
Play, builds separados, revisão de loja).

**Caminho técnico quando for priorizado**: avaliar se um PWA (Progressive Web App) — que
permite "instalar" o site como se fosse app, com ícone na tela inicial e notificações push —
já resolve a necessidade antes de partir para um app nativo de verdade (React Native ou
similar), que é um esforço de desenvolvimento bem maior.

---

## 6. Níveis de permissão granulares

**O que o cliente pediu**: "sim" para níveis de acesso diferentes (administrador, advogado,
secretária, cliente).

**Como o MVP resolve isso de forma simplificada**: o MVP implementa esses quatro papéis como
um campo simples (`papel` na tabela `usuarios`), com lógica de exibição/permissão no código
baseada nesse campo. Isso já distingue equipe de cliente, e dentro da equipe dá para
diferenciar o que cada papel vê na interface.

**O que fica para depois**: permissão fina por funcionalidade (ex: "esta secretária pode
editar processos mas não pode deletar", "este advogado só vê os processos dele, não os de
todo o escritório") exige uma camada de controle de acesso mais sofisticada (RBAC completo
com permissões por ação, não só por papel). Vale esperar o uso real revelar quais
restrições são realmente necessárias antes de construir isso, para não desenhar permissões
que ninguém usa.

**Caminho técnico quando for priorizado**: tabela de permissões separada (`papel` →
`permissoes[]`), com checagem nas Server Actions/rotas de API, e possivelmente RLS mais
granular no Supabase usando essas permissões.

---

## 7. Sincronização em tempo real multiusuário na edição

**O que foi discutido**: a possibilidade de dois membros da equipe verem as mudanças um do
outro ao vivo, estilo Google Docs, ao editar a mesma ficha de cliente/processo.

**Por que não entra no MVP**: decisão consciente de simplicidade — o MVP usa edição inline
com salvamento imediato por campo, mas sem WebSocket de sincronização ao vivo entre sessões
simultâneas. É raro dois usuários editarem exatamente o mesmo registro ao mesmo tempo, e
resolver bem os conflitos de edição concorrente (quem ganha, como avisar o outro usuário)
é complexidade desproporcional ao benefício neste estágio.

**Caminho técnico quando for priorizado**: Supabase Realtime (WebSocket nativo) permite
assinar mudanças em uma tabela/linha e atualizar a UI de outros usuários conectados sem
reload — a infraestrutura já está disponível na stack escolhida, então isso é mais uma
decisão de produto adiada do que uma limitação técnica.
