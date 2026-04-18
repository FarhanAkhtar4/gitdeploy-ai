<div align="center">

# 🚀 GitDeploy AI

**Build any project with AI. Deploy to GitHub. Host for free.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📋 Overview

GitDeploy AI is a comprehensive SaaS platform that combines the power of AI-assisted project scaffolding with seamless GitHub deployment capabilities. Simply describe your project idea, and our AI builder generates a complete, production-ready codebase — then deploy it to GitHub with one click and get expert hosting recommendations.

### ✨ Key Highlights

- **AI Project Builder** — Describe your project in natural language and get a complete, deployable codebase
- **GitHub Deployment Agent** — One-click deploy to GitHub with automatic CI/CD workflow setup
- **Hosting Advisor** — Smart recommendations for free and paid hosting platforms
- **AI Chat Assistant** — Context-aware conversational AI for development help
- **Real-time Deployment Logs** — Live streaming of deployment progress via WebSocket
- **Dark GitHub-style UI** — Beautiful, professional interface inspired by GitHub's design language

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│          Next.js 16 + React 19 + Tailwind 4         │
│              shadcn/ui + Framer Motion               │
├─────────────────────────────────────────────────────┤
│                    API Layer                         │
│     Next.js API Routes + Express-style middleware    │
│              z-ai-web-dev-sdk (AI)                   │
├─────────────────────────────────────────────────────┤
│                  Real-time Layer                     │
│              Socket.io (Port 3003)                   │
├─────────────────────────────────────────────────────┤
│                   Database                           │
│              SQLite + Prisma ORM                     │
│              AES-256-GCM Encryption                  │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Features

### 🤖 AI Project Builder
- **Natural Language Scaffolding** — Describe your project, AI generates complete codebase
- **Template Marketplace** — 8+ pre-built templates across 4 categories (Web Apps, APIs, Mobile, Fullstack)
- **Live Preview** — Browse generated files with syntax-highlighted code preview
- **AI Suggestions** — Context-aware suggestions based on your input (e-commerce, chat, API, dashboard)
- **Progress Milestones** — Visual 4-step milestone tracker with sub-steps and live spinners
- **File Tree** — Hierarchical file explorer for generated project structure

### 🚀 GitHub Deployment Agent
- **One-Click Deploy** — Push projects directly to GitHub repositories
- **CI/CD Workflow Editor** — Visual pipeline builder with 8 step types, YAML preview, and template presets
- **Multi-Environment Support** — Development, Staging, and Production environment configurations
- **Rollback Manager** — Revert to previous deployments with two-step confirmation
- **Deployment Diff Viewer** — Side-by-side comparison of changes between deployments
- **Webhook Configuration** — Slack, Discord, and Email notifications for deployment events
- **Environment Variable Manager** — Encrypted storage, CRUD operations, .env import, required variable validation
- **Real-time Deployment Logs** — Terminal-style live log streaming with 3 tabs (Live, Summary, Errors)
- **Deployment Readiness Score** — Auto-detected checks with circular score indicator

### 🌐 Hosting Advisor
- **Platform Comparison** — Side-by-side feature comparison of Vercel, Netlify, Railway, Render, Fly.io, and more
- **Interactive Star Ratings** — Rate platforms on ease of use, performance, and value
- **Hosting Score** — AI-recommended top 3 platforms with match percentages
- **Cost Calculator** — Estimate hosting costs based on your project needs
- **Setup Guides** — Step-by-step deployment instructions with copy-able commands
- **Feature Customization** — Toggle features to customize comparison view

### 💬 AI Chat Assistant
- **Conversational AI** — Powered by z-ai-web-dev-sdk (Claude Sonnet)
- **Conversation History** — Persistent chat sessions with active conversation highlighting
- **Syntax Highlighting** — Color-coded code blocks in chat responses
- **Context-Aware Chips** — Dynamic suggestion chips that adapt to conversation context
- **Code Execution Preview** — Console and browser preview tabs for code output
- **File Attachments** — Drag-and-drop file upload with type detection
- **Voice Input** — Microphone button with recording animation
- **Message Reactions** — Thumbs up/down feedback on AI responses

### 📊 Dashboard
- **Project Overview** — Stats cards with trend indicators (+/- percentages)
- **Search & Filter** — Search projects by name, filter by framework
- **Card/Table View Toggle** — Switch between grid cards and table layouts
- **Project Analytics** — 4 Recharts visualizations (Area, Donut, Bar, Line charts)
- **Deployment Pipeline** — Kanban-style board (Building → Testing → Deploying → Live)
- **Team Activity Feed** — Real-time team member actions
- **Quick Stats Comparison** — Week-over-week metrics with mini bar charts

### ⚙️ Settings
- **Profile Management** — Avatar with gradient ring, PRO badge, plan info
- **GitHub Integration** — Connect/disconnect with scope validation
- **API Usage Tracker** — Circular SVG meter with category breakdown
- **Security Score** — Visual security assessment with recommendations
- **Connected Accounts** — 6 services (GitHub, GitLab, Bitbucket, Vercel, Netlify, AWS)
- **Activity Log** — Audit trail with type-specific icons and IP addresses
- **Notification Preferences** — Configurable alert settings
- **Danger Zone** — Account deletion with animated shimmer warning

### 🧭 Navigation & UX
- **Command Palette** — ⌘K search across all features
- **Keyboard Shortcuts** — ⌘1-6 view navigation, ⌘N new project, ⌘D deploy
- **Breadcrumb Header** — Context-aware navigation with back button and view metadata
- **Onboarding Wizard** — 5-step guided setup with progress bar, animations, and celebration
- **Notifications Panel** — Real-time notification center
- **File Viewer** — Syntax-highlighted file content viewer
- **Diff Viewer** — Side-by-side code diff comparison
- **Theme Toggle** — Light/dark mode support

---

## 💾 Database Schema

Built with **Prisma ORM** and **SQLite** for zero-config local development:

| Model | Description |
|-------|-------------|
| `User` | User accounts with plan management |
| `GitHubCredential` | Encrypted GitHub tokens (AES-256-GCM) |
| `Project` | Project metadata, framework, deployment status |
| `ProjectFile` | Generated project files with GitHub sync |
| `Deployment` | Deployment records with status tracking |
| `HostingConfig` | Platform-specific hosting configurations |
| `AuditLog` | Security audit trail |

---

## 🔐 Security

- **AES-256-GCM Encryption** — GitHub tokens encrypted at rest with unique IVs and auth tags
- **Token Masking** — Only last 4 characters visible in UI (e.g., `••••••••lOF`)
- **Scope Validation** — Token permissions verified on connection
- **Audit Logging** — All sensitive actions tracked with IP and timestamp
- **Environment Variable Encryption** — Sensitive env vars masked by default

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Animations** | Framer Motion |
| **State** | Zustand + TanStack Query |
| **Database** | SQLite via Prisma ORM |
| **AI** | z-ai-web-dev-sdk (Claude Sonnet) |
| **Real-time** | Socket.io |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Auth** | NextAuth.js v4 |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- A GitHub Personal Access Token (for deployment features)

### Installation

```bash
# Clone the repository
git clone https://github.com/FarhanAkhtar4/gitdeploy-ai.git
cd gitdeploy-ai

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Initialize the database
bun run db:push

# Start the development server
bun run dev
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# Encryption (generate a 32-byte hex string)
ENCRYPTION_KEY="your-32-byte-encryption-key-here"

# AI Service
Z_AI_API_KEY="your-z-ai-api-key"

# GitHub OAuth (optional)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 📁 Project Structure

```
├── prisma/
│   └── schema.prisma          # Database schema (7 models)
├── public/
│   ├── favicon.svg
│   └── logo-gitdeploy.png
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/github/   # GitHub OAuth
│   │   │   ├── chat/          # AI chat endpoint
│   │   │   ├── deploy/        # Deploy status
│   │   │   ├── hosting/       # Hosting recommendations
│   │   │   ├── projects/      # Project CRUD + deploy
│   │   │   ├── rebuild/       # Project rebuild
│   │   │   └── user/          # User profile
│   │   ├── globals.css        # Global styles + animations
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main app entry
│   ├── components/
│   │   ├── ui/                # shadcn/ui components (40+)
│   │   ├── builder-view.tsx   # AI Project Builder
│   │   ├── dashboard-view.tsx # Dashboard & analytics
│   │   ├── deploy-view.tsx    # GitHub Deployment
│   │   ├── hosting-view.tsx   # Hosting Advisor
│   │   ├── chat-view.tsx      # AI Chat Assistant
│   │   ├── settings-view.tsx  # Settings & Profile
│   │   ├── onboarding-wizard.tsx
│   │   ├── command-palette.tsx
│   │   ├── env-manager.tsx
│   │   ├── workflow-editor.tsx
│   │   ├── project-analytics.tsx
│   │   ├── template-marketplace.tsx
│   │   ├── file-tree.tsx
│   │   ├── file-viewer.tsx
│   │   ├── diff-viewer.tsx
│   │   ├── deployment-history.tsx
│   │   ├── deployment-scheduler.tsx
│   │   ├── notifications-panel.tsx
│   │   ├── keyboard-shortcuts.tsx
│   │   ├── terminal-console.tsx
│   │   ├── code-review-assistant.tsx
│   │   ├── api-usage-tracker.tsx
│   │   ├── project-health.tsx
│   │   ├── sidebar-nav.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── ai-service.ts      # z-ai-web-dev-sdk integration
│   │   ├── db.ts              # Prisma client
│   │   ├── encryption.ts      # AES-256-GCM
│   │   ├── github-api.ts      # GitHub REST API
│   │   └── utils.ts           # Utility functions
│   └── store/
│       └── app-store.ts       # Zustand global store
├── examples/
│   └── websocket/             # Socket.io example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## 🎨 Design System

The UI follows a **dark GitHub-inspired** design language:

| Token | Color | Usage |
|-------|-------|-------|
| Background | `#0d1117` | Main background |
| Surface | `#161b22` | Cards, headers, sidebars |
| Border | `#30363d` | Dividers, card borders |
| Primary | `#58a6ff` | Links, active states, CTAs |
| Success | `#3fb950` | Deployed, connected, positive |
| Warning | `#e3b341` | Pending, caution, alerts |
| Error | `#f85149` | Failed, danger, destructive |
| Text Primary | `#c9d1d9` | Headings, body text |
| Text Secondary | `#8b949e` | Labels, descriptions |
| Text Muted | `#484f58` | Timestamps, hints |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open Command Palette |
| `⌘1-6` / `Ctrl+1-6` | Navigate between views |
| `⌘N` / `Ctrl+N` | New project (Builder) |
| `⌘D` / `Ctrl+D` | Deploy selected project |
| `?` | Show keyboard shortcuts |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/github` | GitHub token validation & storage |
| `GET` | `/api/user` | Get user profile |
| `GET` | `/api/projects/list` | List all projects |
| `POST` | `/api/projects/files` | Get project files |
| `POST` | `/api/projects/deploy` | Deploy project to GitHub |
| `DELETE` | `/api/projects/delete` | Delete a project |
| `POST` | `/api/chat` | AI chat completion |
| `GET` | `/api/hosting` | Get hosting recommendations |
| `GET` | `/api/deploy/status` | Get deployment status |
| `POST` | `/api/rebuild` | Rebuild a project |

---

## 🧩 Component Library

Built with **40+ shadcn/ui components** including:

`Accordion` · `Alert` · `AlertDialog` · `Avatar` · `Badge` · `Breadcrumb` · `Button` · `Calendar` · `Card` · `Carousel` · `Chart` · `Checkbox` · `Collapsible` · `Command` · `ContextMenu` · `Dialog` · `Drawer` · `DropdownMenu` · `Form` · `HoverCard` · `Input` · `InputOTP` · `Label` · `Menubar` · `NavigationMenu` · `Pagination` · `Popover` · `Progress` · `RadioGroup` · `Resizable` · `ScrollArea` · `Select` · `Separator` · `Sheet` · `Skeleton` · `Slider` · `Sonner` · `Switch` · `Table` · `Tabs` · `Textarea` · `Toast` · `Toggle` · `ToggleGroup` · `Tooltip`

---

## 🔄 Real-time Features

The Socket.io service (port 3003) provides:

- **Live deployment logs** — Stream build/deploy output in real-time
- **Deployment status updates** — Push notifications on state changes
- **Connection status indicator** — Visual online/offline status

---

## 🧪 Development

```bash
# Run linter
bun run lint

# Push database schema changes
bun run db:push

# Generate Prisma client
bun run db:generate

# Run database migrations
bun run db:migrate

# Reset database
bun run db:reset
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) — React Framework
- [shadcn/ui](https://ui.shadcn.com/) — UI Components
- [Prisma](https://www.prisma.io/) — Database ORM
- [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk) — AI Integration
- [Framer Motion](https://www.framer.com/motion/) — Animations
- [Recharts](https://recharts.org/) — Data Visualization
- [Lucide](https://lucide.dev/) — Icons

---

<div align="center">

**Built with ❤️ by [Farhan Akhtar](https://github.com/FarhanAkhtar4)**

[⬆ Back to Top](#-gitdeploy-ai)

</div>
