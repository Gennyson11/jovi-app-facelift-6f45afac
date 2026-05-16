## Visão Geral

Modernizar o visual de TODO o site (landing + áreas logadas) seguindo a estética do painel da imagem de referência: dashboard SaaS premium, dark, com cards arredondados, glow neon sutil, glassmorphism leve e melhor hierarquia visual. **A paleta azul atual (`hsl(220 90% 56%)` + fundo `hsl(225 50% 4%)`) e a fonte Inter são preservadas.** Nenhuma lógica de negócio, rota, RLS ou edge function é alterada — apenas camada de apresentação.

## Fase 1 — Design System (base de tudo)

Atualizar `src/index.css` e `tailwind.config.ts`:
- Novos tokens semânticos: `--surface-1`, `--surface-2`, `--surface-3` (camadas escuras), `--border-subtle`, `--border-glow`, `--ring-glow`.
- Gradientes refinados: `--gradient-card`, `--gradient-glow-blue`, `--gradient-radial-blue` (halo radial atrás de cards principais como na referência).
- Sombras: `--shadow-soft`, `--shadow-card`, `--shadow-glow-hover`.
- Novas classes utilitárias em `@layer components`: `.panel` (card premium glass), `.panel-hover` (glow on hover), `.status-dot` (bolinha pulsante), `.divider-glow`, `.chip` (badge tipo `#8702`).
- Animações novas no `tailwind.config.ts`: `pulse-dot`, `glow-sweep`, `card-float`, `fade-up`.
- Border radius padrão sobe para `1rem` em painéis principais.

## Fase 2 — Sidebar (componente compartilhado)

Reescrever `src/components/DashboardSidebar.tsx` para o estilo da referência:
- Topo: logo + nome do app + indicador "● PORTAL ATIVO" pulsante.
- Bloco de boas-vindas com nome do usuário + chip com `#ID` (últimos 4 do user_id) + email pequeno.
- Seções "MEUS PRODUTOS / FATURAS / AVISOS / TUTORIAIS" com mesmo padrão de item (ícone + label + badge opcional).
- Rodapé com mini carrossel de "AVISOS" (auto-rotativo, dots) — alimentado pelos avisos já existentes; sem novos endpoints.
- Botão "Sair da conta" destacado em vermelho no fim.
- Mantém todos os itens atuais (Tutoriais, Ferramentas, Streamings, Softwares, Bônus, Loja, Jovi.ia, Sócios, Settings) e a lógica de navegação.
- Versão mobile: drawer com overlay, mesmo conteúdo.

## Fase 3 — Páginas logadas

Aplicar o novo padrão de painel em:
1. **`src/pages/Dashboard.tsx`** — header "Minhas Assinaturas / Escolha a plataforma…", grid 2 colunas (assinatura ativa | adicionar ferramentas), cards de plataforma com:
   - Datas início → fim com slider visual de progresso
   - Badge "● ATIVO" / "EXPIRADO"
   - Ícone da plataforma em quadrado com gradiente
   - Campos credencial (email/senha com botão Copiar/Liberar estilo da referência)
   - CTA inferior em pílula com gradiente azul
2. **`src/pages/Socios.tsx`** — mesmo container `.panel`, cards de métricas (clientes, créditos, recargas) no topo, tabela/lista de clientes em painel inferior.
3. **`src/pages/Admin.tsx`** — wrapper de painel, cards de KPIs no topo, tabs já existentes herdam novo visual via tokens.
4. **`src/pages/Credits.tsx`** e **`src/pages/Settings.tsx`** — wrap em `.panel`, headers consistentes.

Nenhuma alteração de queries, hooks ou estados — apenas JSX/classes.

## Fase 4 — Landing page (`/`)

Redesign completo de `src/pages/Index.tsx` e seções:
- **HeroSection**: layout split — coluna esquerda com headline grande + sub + CTAs em pílula com glow; coluna direita com mockup do dashboard (usa screenshot do painel novo, em card flutuante com `card-float` e halo radial azul).
- **ToolsSection**: grid 4 colunas em desktop, cards com ícone gradiente, hover lift + glow.
- **PricingSection**: 3 colunas com plano do meio destacado (borda glow + badge "Mais popular"); preserva preços atuais.
- **FeaturesSection**: layout bento (mix de cards grandes/pequenos) com micro-ilustrações.
- **FAQSection**: accordion com bordas suaves e hover azul.
- Footer novo minimalista com links + WhatsApp.

## Fase 5 — Microinterações

- `hover:-translate-y-0.5` + `hover:shadow-glow-hover` em todos os cards de painel.
- Transições `duration-300 ease-out` padrão.
- `animate-fade-up` ao montar painéis principais (com pequeno stagger via delay inline).
- Botões: gradiente azul → azul-claro com brilho sutil ao hover (já existe variant `hero`/`accent`, vamos refinar shadow).

## Detalhes técnicos

- Sem mudanças em: `src/integrations/supabase/*`, hooks de dados, edge functions, migrações, `.env`, rotas.
- Sem novas dependências — usa apenas Tailwind, shadcn já instalados, lucide-react e animações CSS.
- Acessibilidade: contraste preservado; foco visível com `--ring-glow`.
- Responsivo: breakpoints `sm/md/lg` revisados; sidebar vira drawer < `lg`; grids colapsam para 1 col em mobile.
- Tema: 100% via tokens semânticos (sem cores hardcoded em componentes).

## Entrega

Implementação em uma passada, sem etapas de aprovação intermediárias. Após o build, faço uma checagem visual rápida do `/dashboard` e da landing para confirmar que o layout casou com a referência.
