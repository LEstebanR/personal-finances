# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal finance app (single-user, personal project — not launched, no real users yet). Tracked in Linear, project **Personal Finances**, team **Lesteban**.

**No gitflow.** Work happens directly on `main` — no release branches, no mandatory PRs, direct commits. This is a solo, pre-launch project; don't introduce branch/PR ceremony unless asked.

## Commands

- `bun dev` — start dev server (Turbopack)
- `bun run build` / `bun run start` — production build / start
- `bun run lint` — ESLint (`next/core-web-vitals`, `next/typescript`)
- `bun run format` — Prettier (writes in place)
- `bun run prisma:generate` — regenerate Prisma client
- `bun run prisma:migrate` — create/apply a dev migration
- `bun run prisma:studio` — open Prisma Studio
- `bun run prisma:push` — push schema without a migration

**Bun is the only package manager** — there's a single `bun.lock`; don't run `npm install` or add a `package-lock.json`.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + Radix UI / shadcn (`components.json`: style `new-york`, RSC on, icon library `lucide`)
- Prisma + **Neon** (serverless Postgres) — target data layer
- **better-auth** (email/password) — target auth layer

### Migration in progress

The codebase currently still runs on **Supabase** (`@supabase/ssr`, `utils/supabase/*`, direct `supabase-js` queries from client components, RLS policies in `supabase/*.sql`) for both auth and data access. This is being migrated to Prisma + Neon + better-auth (see Linear project *Personal Finances* for the issue breakdown). `prisma` and `@prisma/client` are already dependencies but `prisma/schema.prisma` doesn't exist yet — don't assume Prisma is wired up until that migration lands. When working on auth or data access, check whether the relevant piece has already been migrated (Supabase code removed) before adding new Supabase calls.

## Architecture

- Server Actions live in `actions.ts` next to the page/route that uses them (e.g. `app/login/actions.ts`, `app/signup/actions.ts`), not in a shared actions directory.
- UI primitives (shadcn-generated) live in `components/ui/`; feature components live in `components/dashboard/`.
- Business logic goes in `lib/`.
- Import order and formatting are enforced by Prettier plugins (`@trivago/prettier-plugin-sort-imports`, `prettier-plugin-tailwindcss`) — run `bun run format` rather than hand-ordering imports.
- Path alias: `@/*` maps to the repo root (`tsconfig.json`).
- `middleware.ts` gates all routes except `/`, `/login`, `/signup` behind an authenticated-user check (currently via Supabase session, to be migrated to better-auth).
