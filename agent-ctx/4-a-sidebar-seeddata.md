# Task 4-a: Fix Sidebar Truncation & Add Demo Seed Data

## Summary

Fixed sidebar text truncation issues and populated the Zustand store with comprehensive demo/seed data so the app shows realistic content instead of empty states.

## Changes Made

### 1. Sidebar Nav (`src/components/sidebar-nav.tsx`)

- **Width**: Changed expanded sidebar from `w-64` (256px) to `w-[272px]` for more breathing room
- **Description text shortened**:
  - Dashboard: "Overview & stats" → "Stats & activity"
  - Deploy: "Push to GitHub" → "GitHub deploy"
  - Hosting: "Free hosting options" → "Free tiers"
  - AI Assistant: "Ask anything" → "Get help"
  - Settings: "Account & config" → "Account"
  - Project Builder: "Build with AI" (kept, already short enough)
- **Overflow handling**: Added `min-w-0` to the flex-1 div containing label + description
- **Label text**: Added `whitespace-nowrap overflow-hidden` to the label span
- **Description text**: Added `truncate` class to the description paragraph

### 2. App Store (`src/store/app-store.ts`)

Added comprehensive demo data:

- **User**: Alex Chen (demo@gitdeploy.ai, pro plan)
- **GitHub User**: alexchen with 12 public repos, pro plan, repo+workflow scopes
- **isGithubConnected**: set to `true`
- **Projects**: 3 demo projects:
  1. Invoice Manager (live, Next.js, PostgreSQL, has 1 deployment)
  2. Task Manager (building, React, MongoDB)
  3. Analytics Dashboard (not_deployed, Next.js, Supabase)
- **selectedProject**: Set to Invoice Manager (proj-1)
- **Chat Messages**: 2 messages about CI/CD setup
- **Builder Chat**: 2 messages about building invoice management app
- **Generated Files**: 4 files (page.tsx, stripe.ts, schema.prisma, route.ts)
- **Build Progress**: current: 4, total: 22, section: 'Building API routes'

## Verification

- ESLint: Passes with zero errors
- Dev server: Compiles successfully, no runtime errors
- All type assertions (`as ProjectStatus`, `as const`) used correctly for TypeScript compatibility
