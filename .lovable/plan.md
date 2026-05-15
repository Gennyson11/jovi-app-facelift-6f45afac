## Objetivo

Aplicar a linguagem visual da referência (sidebar escura com perfil, cards com borda glow, botões gradiente neon, timeline de validade) em todo o site, **mantendo as cores atuais**: bg `hsl(225 50% 4%)`, primary `hsl(220 90% 56%)`, glow azul, fonte Inter.

## Tokens novos (em `src/index.css` / `tailwind.config.ts`)

- `--gradient-neon-button`: gradiente azul→accent para CTAs primários
- `--shadow-card-glow`: borda interna brilho azul + sombra externa difusa
- `--shadow-neon-hover`: glow intensificado no hover
- `.card-neon`: card translúcido com borda 1px gradiente azul + glow externo
- `.btn-neon-gradient`: variante de Button com gradiente, brilho no hover, sutil shimmer
- `.sidebar-profile`: bloco perfil topo (avatar quadrado, nome + chip ID, email truncado)

Nenhuma cor hard-coded — tudo HSL via tokens.

## Componentes redesenhados

**1. `src/components/DashboardSidebar.tsx`**
- Topo: logo + chip "PORTAL ATIVO" (verde pulse)
- Bloco "Bem-vindo de volta 👋" + nome em destaque + chip `#ID` + email muted
- Itens de menu com ícone à esquerda, badge à direita (contador "Avisos 6", chip "NEW" em Tutoriais)
- Footer: card "AVISOS" com dicas rotativas + botão "Sair da conta" vermelho destacado

**2. `src/pages/Dashboard.tsx` — bloco "Minhas Assinaturas"**
- Header: H1 "Minhas Assinaturas" + subtítulo
- Layout 2 colunas (lg): coluna esquerda = card de plataforma ativa; coluna direita = card upsell "Adicionar Ferramentas" com ícone carrinho + CTA "Explorar Opções"
- Card de plataforma redesenhado:
  - Topo: range de datas `15/05 → 15/06` + slider visual de progresso + círculo grande "32 DIAS REST." no canto (ring colorido por urgência)
  - Linha plataforma: ícone quadrado + nome + "Produto ativo" + badge ATIVO verde
  - Campos credencial: rótulo uppercase muted + valor monoespaçado + botão "Copiar" gradiente
  - Senha: botão "Liberar" (olho) gradiente
  - Rodapé: hint "Use sempre em aba anônima…" + 2 CTAs lado a lado ("Pegar código" / "Ir para o Flow")
- Card de plataforma bloqueada mantém grayscale + padlock (regra existente)

**3. `src/pages/Socios.tsx` + `src/pages/Admin.tsx`**
- Aplicar `card-neon` nos painéis principais
- Padronizar headers de seção (H1 + subtítulo muted)
- Botões primários → `btn-neon-gradient`
- Sidebar admin segue mesmo padrão visual do DashboardSidebar

**4. Landing (`/`)**
- `HeroSection`: manter copy, aplicar gradiente neon no CTA principal e cards de feature com `card-neon`
- `PricingSection`: cards com borda glow, plano destacado com glow intensificado
- `FeaturesSection` / `ToolsSection` / `FAQSection`: trocar cards atuais por `card-neon`, manter conteúdo

**5. `src/pages/Auth.tsx`, `Plans.tsx`, `Revendedores.tsx`, `Credits.tsx`, `Invite.tsx`, `Settings.tsx`**
- Substituir `card-glass`/`card-glass-blue` por `card-neon` onde fizer sentido
- CTAs principais → `btn-neon-gradient`

## O que NÃO muda

- Paleta (continua azul cyberpunk atual)
- Lógica de negócio, rotas, RLS, edge functions
- Regras de acesso, expiração, créditos
- Conteúdo textual existente
- Música player flutuante e WhatsApp flutuante

## Detalhes técnicos

- Novo `Button` variant `neon` em `src/components/ui/button.tsx` (não remover variantes existentes)
- Slider de validade: componente puro CSS (div + ::after) calculando `%` via `(today - start) / (end - start)`
- Círculo "DIAS REST.": SVG `<circle>` com `stroke-dasharray` animado
- Responsivo: sidebar vira drawer no mobile (Sheet do shadcn), grid 2-col vira 1-col
- Memória a atualizar após implementação: novo memo `style/hub-central-redesign` com tokens e regras

## Ordem de execução

1. Tokens CSS + variant `neon` do Button
2. `DashboardSidebar` (impacta múltiplas páginas)
3. `Dashboard.tsx` (card de plataforma — peça central)
4. Landing (Hero, Pricing, Features, Tools, FAQ)
5. Socios + Admin
6. Páginas restantes (Auth, Plans, Revendedores, Credits, Invite, Settings)
7. QA visual em desktop + mobile
