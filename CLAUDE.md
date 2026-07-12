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
- Prisma + **Neon** (serverless Postgres) — Neon project `personal-finances` (`young-river-84996872`)
- **better-auth** — Google OAuth only (no email/password). `AuthAccount` is better-auth's own account/credential model, mapped away from `Account` (the business model for bank/cash accounts) to avoid a name collision.

Supabase has been fully removed — there's no `utils/supabase/*`, no `@supabase/*` dependency, no `supabase/*.sql`. Don't reintroduce it.

## Architecture

- Server Actions live in `actions.ts` next to the route/feature that uses them (e.g. `app/dashboard/accounts/actions.ts`, `app/dashboard/transactions/actions.ts`, `app/dashboard/overview/actions.ts`), not in a shared actions directory.
- `lib/prisma.ts` exports the Prisma client singleton; `lib/auth.ts` is the better-auth server config; `lib/auth-client.ts` is the browser client (`authClient.signIn.social`, `authClient.signOut`, `useSession`); `lib/session.ts` exposes `getServerSession()` for Server Components/Actions.
- Prisma `Decimal` fields (balances/amounts) must be converted with `Number(...)` before returning from a Server Action to a Client Component — Decimal instances don't survive RSC serialization.
- Account balance mutations (`createTransaction`, `createTransfer` in `app/dashboard/transactions/actions.ts`) run inside `prisma.$transaction` using atomic `increment`/`decrement`, not read-then-write.
- UI primitives (shadcn-generated) live in `components/ui/`; feature components live in `components/dashboard/`.
- `components/dashboard/*` are client components that call Server Actions directly (no REST layer) — `app/dashboard/page.tsx` switches between them based on a `?<view>` search param rather than separate routes.
- Import order and formatting are enforced by Prettier plugins (`@trivago/prettier-plugin-sort-imports`, `prettier-plugin-tailwindcss`) — run `bun run format` rather than hand-ordering imports.
- Path alias: `@/*` maps to the repo root (`tsconfig.json`).
- `middleware.ts` does a lightweight, Edge-safe cookie check (`getSessionCookie` from `better-auth/cookies`) to gate all routes except `/`, `/login`, `/signup` — it does not hit the database. Full session validation (`getServerSession()`) happens in `app/dashboard/layout.tsx` and in each Server Action.
