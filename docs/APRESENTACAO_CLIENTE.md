# Plataforma do Escritório — o que está pronto

Documento para apresentação ao cliente. Linguagem de negócio, sem jargão técnico.
Atualizado em julho/2026.

---

## Em uma frase

Uma plataforma em que a **equipe gerencia clientes, processos, prazos e comunicados**, o
**sistema monitora intimações e andamentos automaticamente**, e o **cliente acompanha o
próprio caso pelo celular** — com o escritório no controle do que fica visível.

---

## Para quem serve

| Quem | O que ganha |
| --- | --- |
| **Advogado / equipe** | Painel interno completo: clientes, processos, intimações, prazos, audiências, importação em massa |
| **Administração** | Equipe, calendários forenses, comunicados, auditoria, visão do dia |
| **Cliente do escritório** | Área própria (mobile): processos, andamentos em linguagem simples, documentos liberados, comunicados |

Login separado para equipe e para cliente. Cada cliente só vê os próprios dados.

---

## O ciclo que o sistema fecha

```
Tribunal publica → plataforma detecta → equipe confirma → cliente é informado
```

1. **Intimação no DJEN** chega no painel (monitoramento por OAB).
2. Advogado transforma em **tarefa com prazo** (dias úteis, calendário local se houver).
3. **Andamentos** são consultados no Datajud (automático + botão “verificar agora”).
4. Equipe decide o que o cliente vê na **linha do tempo**.
5. Se marcado, o **cliente recebe e-mail** e vê o andamento traduzido.
6. **Comunicados** do escritório chegam individualmente, com status lido/não lido.

---

## Funcionalidades da equipe (painel interno)

### Visão do dia
Na entrada do painel, três prioridades lado a lado:
- intimações ainda não lidas;
- seus prazos da semana (com alerta por urgência);
- processos com movimentação recente.

### Clientes e processos
- Cadastro e busca de clientes (nome, CPF/CNPJ).
- Ficha do cliente com dados, serviços contratados e processos vinculados.
- Cadastro de processo com número CNJ: o sistema identifica o tribunal e oferece atalho para
  o portal oficial.
- Botão para buscar dados da capa no tribunal (assunto, vara, ajuizamento) — o advogado
  confere e salva.
- Linha do tempo manual (eventos), com controle do que o cliente pode ver.
- Documentos anexados, também com controle de visibilidade.
- Observações internas (só equipe) e públicas (cliente).

### Importação em massa
Para não cadastrar milhares de processos à mão:
- upload ou colagem de planilha/CSV;
- validação linha a linha;
- criação de clientes e processos em lote;
- preenchimento automático da capa em fila (em segundo plano).

### Intimações (DJEN / Comunica)
- Busca automática diária (dias úteis) das publicações no Diário de Justiça Eletrônico,
  por OAB de cada advogado do escritório.
- Texto integral da intimação, vínculo ao processo pelo CNJ (ou alerta se o processo ainda
  não estiver cadastrado).
- Marcar como lida e criar tarefa a partir da intimação.
- Resumo por e-mail para o advogado (digest, sem spam de um e-mail por item).

### Prazos e Kanban
- A partir da intimação: sugere prazo em dias úteis na lógica do CPC (publicação → início →
  contagem só em dias úteis).
- Feriados nacionais já entram no cálculo.
- Feriados estaduais/municipais e recessos vêm de **calendários forenses** que o próprio
  escritório cadastra (fonte oficial, UF/comarca, versão publicada).
- A data sugerida é **sempre confirmável** pelo advogado (pode ajustar ou criar sem prazo).
- No quadro de tarefas: cores por urgência e aviso de quantos dias úteis restam.
- E-mail diário com prazos vencidos, vencendo hoje e no próximo dia útil.

### Calendários forenses
- Cadastro de rascunho → inclusão de feriados ou intervalos de recesso → publicação.
- Versão publicada não se edita: correção gera nova versão (o histórico do que foi usado
  no prazo permanece auditável).
- Processo pode ficar vinculado a um calendário específico da comarca.

### Andamentos (Datajud / CNJ)
- Consulta automática periódica dos processos ativos.
- Consulta manual sob demanda (“Verificar agora”).
- Histórico de verificações com data/hora e origem (automática ou manual).
- Aviso claro de que a atualização **não é instantânea** e depende do tribunal de origem
  (cobertura e atraso variam).

### Audiências
- Agenda com data/hora, tipo, local ou link de vídeo, vínculo opcional ao processo.
- Lembrete por e-mail (hoje e próximo dia útil).
- Exportação para calendário (Google Calendar / Outlook via arquivo ICS).

### Comunicados
- Mensagens do escritório para todos os clientes ou para destinatários escolhidos.
- Cada cliente tem leitura e contador próprios.
- E-mail de aviso por destinatário.

### Equipe
- Convidar membros (admin, advogado, secretária).
- Informar OAB (necessário para o monitoramento de intimações).
- Alterar papel ou remover acesso pela própria plataforma.

### Auditoria
- Registro de quem alterou o quê (clientes, processos, documentos, linha do tempo).
- Tela restrita a administradores, com histórico recente e diferença de/para.

---

## Funcionalidades do cliente (área do cliente)

Pensada para uso no celular:

- Login próprio.
- Lista dos processos e serviços vinculados a ele.
- Detalhe do processo: status, dados do tribunal, linha do tempo **somente com o que a
  equipe liberou**.
- Andamentos em **linguagem simples** (ex.: em vez de só “Conclusos para despacho”, uma
  explicação legível; o texto técnico aparece em menor destaque).
- Documentos liberados pelo escritório, com download.
- Observações públicas do processo.
- Comunicados do escritório, com indicador de não lidos.
- Perfil com dados cadastrais e serviços contratados.
- Opção de analisar andamento sob demanda (com a mesma transparência de fonte e última
  consulta).

O cliente **não** vê observações internas, documentos não liberados nem a operação interna
do escritório.

---

## Notificações por e-mail (resumo)

| Situação | Quem recebe |
| --- | --- |
| Novas intimações no DJEN | Advogado (resumo do dia) |
| Novas movimentações no Datajud | Advogado responsável (ou admins, se não houver responsável) |
| Prazo vencido / vencendo | Membro da equipe com a tarefa |
| Audiência hoje / amanhã | Equipe |
| Andamento publicado e liberado ao cliente | Cliente (se o processo estiver com notificação ligada) |
| Comunicado do escritório | Cliente destinatário |

A notificação ao cliente por andamento é **opt-in por processo** (desligada por padrão): a
equipe liga quando quiser que aquele caso avise por e-mail.

---

## Segurança e confiança

- Separação clara entre área da equipe e área do cliente.
- Cada cliente só acessa o que é dele.
- Controle fino do que aparece para o cliente (linha do tempo e documentos).
- Rastreio de alterações sensíveis (auditoria).
- Tema claro e escuro; área do cliente preparada para celular.
- Cuidados de acessibilidade nas telas principais (navegação por teclado, contraste,
  mensagens de erro claras).

---

## O que o escritório administra sozinho

Sem precisar abrir painel técnico externo no dia a dia:

- clientes, processos, documentos e visibilidade;
- equipe e OAB;
- calendários forenses da comarca;
- comunicados;
- audiências e tarefas/prazos;
- importação em massa.

A configuração técnica (e-mail, chaves de consulta, ambiente) é feita uma vez no deploy;
depois a operação fica na plataforma.

---

## Transparência importante (Datajud)

A consulta automática de andamentos usa a **API pública do Datajud (CNJ)**: gratuita e
nacional, porém:

- o tribunal pode demorar a refletir a movimentação;
- a cobertura e a frequência variam conforme o tribunal;
- a plataforma mostra **quando** foi a última consulta e **de onde** veio a informação.

Intimações no **DJEN** costumam ser do mesmo dia e complementam o Datajud justamente no
ponto mais crítico: obrigação com prazo.

---

## O que ainda não faz parte deste entregável

| Item | Situação |
| --- | --- |
| **Site institucional** (home, sobre, áreas, equipe, contato) | Previsto na próxima etapa de produto |
| WhatsApp | Adiado de propósito (custo e aprovação de templates); e-mail cobre o essencial |
| Descobrir processos novos só pelo nome/CPF da parte | Exige API paga de terceiros; fora do escopo atual |
| Relatórios gerenciais avançados | Melhor depois de alguns meses de uso real |
| App nativo (loja) | A área do cliente já é mobile no navegador |

---

## Como sugerimos apresentar na reunião

1. Abrir o **painel da equipe** → visão do dia.
2. Mostrar uma **intimação** → criar tarefa com prazo e calendário.
3. Abrir um **processo** → verificar andamento e explicar o aviso de fonte/atraso.
4. Mostrar o que o **cliente** vê no celular (linguagem simples + documento liberado).
5. Enviar um **comunicado** de teste e mostrar o badge de não lido.
6. Fechar com o quadro “o que ainda não entra” (acima), para alinhar expectativa.

---

## Próximo passo sugerido com o cliente

1. Aceite funcional em ambiente de homologação (roteiro acima).
2. Cadastro dos calendários das comarcas usadas no dia a dia.
3. Preenchimento das OABs da equipe.
4. Importação piloto de um lote real de processos.
5. Go-live da equipe; site institucional na sequência, se desejado.
