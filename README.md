# FTD Nexus — 4DX + COBRA Platform

> Sistema executivo PWA para gestão de metas (4DX) e pipeline comercial (COBRA) da FTD Educação · Regional Centro-Norte

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4)](https://tailwindcss.com)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript |
| Estilo | Tailwind CSS + design system customizado |
| Estado | Zustand + TanStack Query |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Deploy | Vercel (CI/CD automático) |
| PWA | next-pwa + Service Worker |
| Gráficos | Recharts |
| DnD | @dnd-kit |
| Exportação | jsPDF + ExcelJS |
| Forms | React Hook Form + Zod |
| Notificações | Sonner |
| Animações | Framer Motion |

---

## Início rápido

### 1. Clone e instale

```bash
git clone https://github.com/seu-org/ftd-nexus.git
cd ftd-nexus
npm install
```

### 2. Configure variáveis de ambiente

```bash
cp .env.local.example .env.local
# Edite .env.local com suas credenciais Supabase
```

### 3. Configure o banco de dados

```bash
# Instale o Supabase CLI
npm install -g supabase

# Inicie o Supabase local (opcional)
supabase start

# Execute as migrations
supabase db push
# ou execute manualmente:
# supabase/migrations/001_schema.sql
# supabase/migrations/002_rls.sql
# supabase/migrations/003_functions.sql
```

### 4. Inicie o desenvolvimento

```bash
npm run dev
# http://localhost:3000
```

---

## Estrutura do projeto

```
ftd-nexus/
├── app/
│   ├── (auth)/login/          # Página de login
│   ├── (dashboard)/           # Área autenticada
│   │   ├── war-room/          # Dashboard principal (3 roles)
│   │   ├── equipe/            # Gestão da equipe
│   │   ├── 4dx/               # Metodologia 4DX
│   │   ├── cobra/             # Pipeline COBRA
│   │   ├── autocuidado/       # Desenvolvimento pessoal
│   │   ├── relatorios/        # Analytics e exportação
│   │   ├── configuracoes/     # Configurações
│   │   └── guia/              # Guia prático
│   ├── auth/callback/         # Callback OAuth/magic link
│   ├── globals.css            # Design system CSS
│   └── layout.tsx             # Root layout
│
├── components/
│   ├── dashboard/             # War Room components
│   ├── 4dx/                   # Componentes 4DX
│   ├── cobra/                 # Kanban, Radar, Formulários
│   ├── exports/               # PDF e Excel
│   ├── layout/                # Sidebar, Topbar, AppShell
│   ├── notifications/         # Painel de notificações
│   ├── providers/             # AuthProvider, QueryProvider, RealtimeProvider
│   └── ui/                    # KPICard, Badge, Avatar, etc.
│
├── lib/
│   ├── hooks/                 # use4dx, useCobra, useNotifications, useExports
│   ├── store/                 # Zustand stores
│   ├── supabase/              # client, server, types
│   └── utils/                 # cn, dates, formatters, calculations
│
├── supabase/migrations/       # SQL migrations
├── public/                    # Static assets + manifest.json
├── middleware.ts              # Auth middleware
├── next.config.ts             # Next.js + PWA config
├── tailwind.config.ts         # Design system
└── tsconfig.json
```

---

## Roles e permissões

| Role | Acesso |
|---|---|
| `admin` | CRUD total, todos os grupos |
| `gerente` | CRUD no grupo, leitura regional |
| `coordenador` | CRUD no grupo, War Room coord/consult |
| `consultor` | Próprios registros + leitura do grupo |
| `viewer` | Somente leitura |

---

## Módulos do sistema

### 🎯 4DX — As 4 Disciplinas da Execução

| Disciplina | Descrição |
|---|---|
| **D1 — WIG/MCI** | Meta Crucialmente Importante com prazo e resultado |
| **D2 — Lead Measures** | Medidas de direção semanais sob controle do consultor |
| **D3 — Scoreboard** | Placar binário verde/vermelho por semana |
| **D4 — Cadência** | Sessão de 20 min toda semana — 3 momentos |

### 🐍 COBRA — Pipeline Comercial

| Módulo | Descrição |
|---|---|
| **Pipeline Kanban** | Drag-and-drop entre etapas com realtime |
| **Escolas / CRM** | Cadastro completo + histórico de interações |
| **Avaliação** | 5 critérios por perfil · 0-5 pts · loop com D2 |
| **Atividades** | Log de interações, follow-ups, agenda |

### 📊 Realtime

Eventos sincronizados em tempo real via Supabase:
- Scoreboard D3 → atualiza gráficos de todos do grupo
- Pipeline → move cards no kanban dos outros usuários
- Notificações → toast imediato no destinatário
- Compromissos → status na sessão de cadência em andamento

---

## Deploy (Vercel)

```bash
# 1. Conecte o repositório ao Vercel
# 2. Configure as variáveis de ambiente no painel Vercel:
#    NEXT_PUBLIC_SUPABASE_URL
#    NEXT_PUBLIC_SUPABASE_ANON_KEY
#    SUPABASE_SERVICE_ROLE_KEY
#    NEXT_PUBLIC_APP_URL
# 3. Deploy automático a cada push na branch main
```

---

## PWA — Instalação

O FTD Nexus é instalável como app nativo:

- **iOS**: Safari → Compartilhar → Adicionar à tela inicial
- **Android**: Chrome → Menu → Adicionar à tela inicial
- **Desktop**: Chrome/Edge → Ícone de instalação na barra de endereços

---

## Design System

### Cores principais

| Token | Valor | Uso |
|---|---|---|
| `--color-navy` | `#0A1628` | Sidebar, headers |
| `--color-brand` | `#1565C0` | Ações primárias, links |
| `--color-coral` | `#FF7A59` | Acento, COBRA |
| `--color-ok` | `#00875A` | Sucesso, verde |
| `--color-warning` | `#FF991F` | Atenção, amarelo |
| `--color-danger` | `#DE350B` | Crítico, vermelho |

### Classes CSS customizadas

```css
.card           /* Card padrão */
.btn-primary    /* Botão primário */
.btn-ghost      /* Botão secundário */
.badge          /* Badge/tag */
.kpi-card       /* KPI com borda colorida no topo */
.progress-bar   /* Barra de progresso */
.data-table     /* Tabela de dados */
.form-input     /* Input de formulário */
.page-content   /* Wrapper da área de conteúdo */
.app-shell      /* Layout principal (sidebar + content) */
```

---

## Scripts

```bash
npm run dev          # Desenvolvimento local
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm run db:types     # Gera tipos do Supabase
```

---

## Contribuindo

1. Branch: `feat/nome-da-feature` ou `fix/nome-do-bug`
2. Commits: Conventional Commits (`feat:`, `fix:`, `chore:`)
3. PR com descrição do que foi alterado e por quê

---

*FTD Educação · Sistema FTD Nexus · Regional Centro-Norte · 2027*
