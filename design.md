# Prompt para implementação — Redesign visual do painel Bertoldi


---

## Contexto

Este é um sistema de gestão jurídica (estilo dashboard interno) construído em **Next.js + TypeScript**. O visual atual está em dark mode "cru": tudo no mesmo cinza-quase-preto, cards planos sem profundidade, sem hierarquia tipográfica clara, sem cor de marca aplicada de forma consistente.

Quero uma repaginada visual **sem mudar a estrutura de dados ou funcionalidade** — apenas estilos (CSS/Tailwind/styled-components, o que o projeto já usar). Referências de estilo: dashboards SaaS modernos com dark mode "premium" (tipo Linear, Notion dark, ou os dashboards de referência: FocusFlow, HubSpot workspace dark) — usam gradiente sutil, glassmorphism, glow em elementos ativos, sombra real para profundidade.

## Direção visual

### 1. Cor de marca (accent)
- Defina UMA cor de accent forte e use com convicção em: botão primário, ícones ativos, badges de destaque, bordas de foco, números/métricas principais.
- Sugestão: #193C8A para manter a identidade "Bertoldi" (nome de escritório de advocacia, tom sério/elegante). Se preferir mais vibrante/SaaS, um verde-limão (`#8FE24A` base) também funciona — mas dourado combina mais com o tom "advocacia".
- Crie essa cor como CSS variable / token no tema (`--accent`, `--accent-hover`, `--accent-foreground`) para reuso consistente.

### 2. Profundidade real (não é possível em CSS "chapado")
- Cards principais: `background: linear-gradient(180deg, rgba(accent, 0.08), rgba(accent, 0.02))` sutil sobre o fundo escuro base, OU um gradiente radial suave no canto superior esquerdo do card em destaque.
- Sombra real nos cards elevados: `box-shadow: 0 8px 24px rgba(0,0,0,0.4)` — nada de "flat design" total.
- Glow sutil em elementos ativos/selecionados: `box-shadow: 0 0 20px rgba(accent, 0.25)` no card ou botão em foco/hover.
- Para modais ou painéis flutuantes (ex: "criar novo" lateral), considere glassmorphism: `background: rgba(20,20,20,0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08)`.

### 3. Bordas e raios
- Cards principais: `border-radius: 20px–24px` (não 8px).
- Badges/pills: `border-radius: 999px` sempre.
- Botões: `border-radius: 12px` ou pill total, dependendo do peso visual desejado.

### 4. Tipografia — hierarquia dramática
- Título de página: 24–28px, peso 500–600, cor quase branco puro (`#F5F2EA` ou similar, não branco puro `#FFF`).
- Números de destaque (métricas): 28–36px, peso 500, na cor de accent quando forem "urgentes/positivos".
- Metadado/legenda: 11–12px, cor bem apagada (`#8A8578` ou equivalente em cinza-quente), *sem* tentar competir visualmente com o conteúdo principal.
- Evite manter tudo no mesmo peso de fonte — o objetivo é que o olho saiba exatamente onde olhar primeiro.

### 5. Avatares e identidade visual de pessoas
- Toda entidade "responsável"/"atualizado por" deve ter um avatar circular — iniciais com fundo na cor accent (opacidade baixa) quando não houver foto real.
- Isso substitui o "Updated by [nome em texto puro]" atual.

### 6. Badges semânticos por status
- Cada status de processo (Triagem, Em análise, Distribuído, Em andamento, Concluído) recebe uma cor fixa e consistente (ex: Triagem = azul, Em análise = âmbar, Concluído = verde, Distribuído = roxo) usada tanto nos filtros quanto nos badges dentro dos cards.
- Badge = pill pequeno, fundo com opacidade baixa da cor semântica, texto na versão "dark"/saturada da mesma cor (nunca texto branco puro sobre fundo colorido).

### 7. Cards de card — sub-elementos
- Em cards que listam múltiplos itens internos (ex: "Intimações não lidas" com 5 itens), cada item interno deve ter seu próprio "mini card" com fundo levemente diferente do card pai, não apenas linhas de texto separadas por espaço.

## Escopo de aplicação
Aplique esse sistema visual nas telas: **Painel** (dashboard principal), **Processos**, **Clientes** — reaproveitando os mesmos tokens de cor, radius e tipografia em todas.

## O que NÃO mudar
- Estrutura de componentes/rotas existente.
- Dados, lógica de negócio, chamadas de API.
- Textos e labels (a menos que peça explicitamente).

## Entregável esperado
- Tokens de tema centralizados (arquivo de tema/CSS variables) para reuso.
- Componentes de Card, Badge e Avatar atualizados/criados se ainda não existirem como componentes reutilizáveis.
- Aplicação visual nas três telas mencionadas.