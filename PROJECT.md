# IPOPilot — Project Reference

> Auto-generated: 2026-06-25. Update this file after every meaningful code change.
> Path: `PROJECT.md` (project root)

---

## What is this?

IPOPilot is an **open-source web dashboard** that automatically applies for IPOs on **MeroShare** (Nepal's CDSC stock platform) in the background. Users link their MeroShare accounts, and a background worker logs in, detects open IPO/FPO/RIGHT issues, and auto-submits applications. When allotment results come out, it checks and notifies the user.

>  This project has no affiliation with CDSC, MeroShare, or NEPSE.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   apps/web                          │
│           Next.js 14 (App Router)                    │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐          │
│  │ Dashboard │ │ API Routes│ │ Auth      │          │
│  │ (Overview,│ │ (/api/…)  │ │ (NextAuth │          │
│  │  IPOs,    │ │           │ │  v4)      │          │
│  │  Apps,    │ │ - accounts│ │           │          │
│  │  Accounts,│ │ - register│ │ JWT-based │          │
│  │  Portfolio│ │ - ipos    │ │ sessions  │          │
│  │  Settings)│ │ - proxy   │ │           │          │
│  └───────────┘ └──────────┘ └───────────┘          │
│         ↕ SWR hooks (client-side fetching)          │
└──────────────────────┬──────────────────────────────┘
                       │ shared via workspace packages
┌──────────────────────┼──────────────────────────────┐
│               packages                                │
│  ┌─────────────────┐  ┌──────────────────┐           │
│  │ @ipopilot/db     │  │ @ipopilot/        │           │
│  │ (Prisma + PG)   │  │ meroshare-client │           │
│  └─────────────────┘  │ (typed HTTP      │           │
│  ┌─────────────────┐  │  client for CDSC)│           │
│  │ @ipopilot/ui     │  └──────────────────┘           │
│  │ (shared UI —    │                                  │
│  │  WIP, no files  │                                  │
│  │  yet)            │                                  │
│  └─────────────────┘                                  │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│                   apps/worker                         │
│            Node.js background process                 │
│  ┌────────────────┐  ┌───────────────────┐           │
│  │ BullMQ Worker  │  │ node-cron Scheduler│          │
│  │ (auto-apply)   │  │ - pollOpenIPOs:4h │           │
│  │ concurrency: 3 │  │ - checkResults:6h │           │
│  └────────────────┘  └───────────────────┘           │
│         ↕ Redis (BullMQ queue + connection)           │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│              Infrastructure (Docker)                   │
│  ┌─────────────────┐  ┌──────────────────┐           │
│  │ PostgreSQL 16   │  │ Redis 7 (Alpine) │           │
│  │ (Alpine)        │  │                  │           │
│  └─────────────────┘  └──────────────────┘           │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. **User** registers via `/register` → creates `User` row (bcrypt-hashed password)
2. **User** adds MeroShare account via modal → browser calls CDSC through `/api/proxy/meroshare/...` (CORS bypass), fetches profile, POSTs encrypted credentials to `/api/accounts`
3. **Cron scheduler** (`pollOpenIPOs`, every 4h) → logs into CDSC with one active account, fetches `getCurrentIssues()`, upserts `IPOIssue` rows, creates `IPOApplication` rows (status: PENDING) for every `active_account × open_issue` pair, enqueues BullMQ `auto-apply` jobs
4. **BullMQ Worker** (`autoApply`, concurrency 3) → decrypts account password, logs into CDSC, fetches bank details (if missing), calls `submitApplication()`, marks status APPLIED/FAILED
5. **Cron scheduler** (`checkResults`, every 6h) → queries CDSC application search for APPLIED apps past close date, updates status to ALLOTTED/NOT_ALLOTTED
6. **Web dashboard** → React pages with SWR hooks polling API routes, rendering stats, tables, and activity feeds

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS 3, SWR |
| **Auth** | NextAuth.js v4 (Credentials provider, JWT sessions) |
| **API** | Next.js API routes (REST-like JSON) |
| **DB** | PostgreSQL 16 via Prisma 5.x |
| **ORM** | Prisma Client (singleton in `@ipopilot/db`) |
| **Queue** | BullMQ (Redis-backed) |
| **Scheduler** | node-cron |
| **Worker** | tsx (dev), tsup (build), Node.js |
| **CDSC API** | Unofficial typed client (`@ipopilot/meroshare-client`) |
| **Encryption** | AES-256-GCM (Node `crypto` module) for MeroShare passwords |
| **Monorepo** | pnpm workspaces + Turborepo |
| **Infra** | Docker Compose (PostgreSQL + Redis) |
| **Language** | TypeScript 5.x (strict mode) |

---

## File Tree

```
IPOPilot/
├── apps/
│   ├── web/                          # Next.js 14 dashboard + API
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/login/page.tsx        # Sign-in page
│   │   │   │   ├── (auth)/register/page.tsx     # Registration page
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── layout.tsx               # Sidebar + Topbar + MobileNav
│   │   │   │   │   ├── page.tsx                 # Overview: stats, open IPOs, activity
│   │   │   │   │   ├── accounts/page.tsx        # Linked accounts management
│   │   │   │   │   ├── applications/page.tsx    # Application history table
│   │   │   │   │   ├── ipos/page.tsx            # IPO table
│   │   │   │   │   ├── ipos/[id]/page.tsx       # IPO detail page
│   │   │   │   │   ├── portfolio/page.tsx       # Allotment cards
│   │   │   │   │   └── settings/page.tsx        # User settings (WIP buttons)
│   │   │   │   ├── api/
│   │   │   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   │   │   ├── register/route.ts
│   │   │   │   │   ├── accounts/route.ts        # GET list, POST add
│   │   │   │   │   ├── accounts/[id]/route.ts   # PATCH, DELETE
│   │   │   │   │   ├── applications/route.ts
│   │   │   │   │   ├── ipos/route.ts
│   │   │   │   │   ├── ipos/[id]/route.ts
│   │   │   │   │   ├── notifications/route.ts
│   │   │   │   │   ├── portfolio/route.ts
│   │   │   │   │   └── proxy/meroshare/[...path]/route.ts  # CDSC CORS proxy
│   │   │   │   ├── layout.tsx                   # Root layout (dark mode)
│   │   │   │   ├── page.tsx                     # Redirects to /dashboard
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── accounts/AccountCard.tsx
│   │   │   │   ├── accounts/AddAccountModal.tsx  # 2-step modal
│   │   │   │   ├── common/EmptyState.tsx
│   │   │   │   ├── common/LoadingSkeleton.tsx
│   │   │   │   ├── common/PasswordInput.tsx
│   │   │   │   ├── common/SessionProvider.tsx
│   │   │   │   ├── common/StatCard.tsx
│   │   │   │   ├── common/StatusBadge.tsx
│   │   │   │   ├── layout/Sidebar.tsx
│   │   │   │   ├── layout/Topbar.tsx
│   │   │   │   └── layout/MobileNav.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAccounts.ts
│   │   │   │   ├── useApplications.ts
│   │   │   │   ├── useIPOs.ts
│   │   │   │   └── useNotifications.ts
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts          # NextAuth options
│   │   │   │   ├── crypto.ts        # AES-256-GCM encrypt/decrypt
│   │   │   │   ├── proxy.ts         # CDSC proxy helper
│   │   │   │   └── session.ts       # getSession/requireSession
│   │   │   ├── types/index.ts
│   │   │   └── middleware.ts        # Protects /dashboard and /api/*
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   └── package.json
│   └── worker/                       # Background worker
│       ├── src/
│       │   ├── index.ts             # Entry point: BullMQ worker + cron
│       │   ├── connection.ts        # Redis connection
│       │   ├── crypto.ts            # AES-256-GCM (identical to web)
│       │   ├── scheduler.ts         # node-cron jobs
│       │   ├── jobs/
│       │   │   ├── autoApply.ts     # BullMQ job handler
│       │   │   ├── pollOpenIPOs.ts  # Detect IPOs, queue applications
│       │   │   └── checkResults.ts  # Check allotment results
│       │   └── services/
│       │       └── notification.ts  # Create Notification rows
│       ├── test-crypto.ts
│       └── package.json
├── packages/
│   ├── db/                           # Prisma schema + client singleton
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts              # Fetch CDSC DP list
│   │   │   └── seed-user.ts         # Seed test user
│   │   ├── src/index.ts             # PrismaClient singleton
│   │   └── package.json
│   ├── meroshare-client/             # Typed HTTP client for CDSC API
│   │   ├── src/
│   │   │   ├── index.ts             # MeroShareClient class
│   │   │   ├── endpoints.ts         # API path constants
│   │   │   └── errors.ts            # MeroShareError class
│   │   ├── test-login.ts
│   │   └── package.json
│   └── ui/                           # Shared UI components (empty — WIP)
│       ├── package.json
│       └── tsconfig.json
├── scripts/
│   └── test-owndetail.ts            # Manual CDSC API test script
├── docker-compose.yml               # PostgreSQL 16 + Redis 7
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── package.json                     # Root: pnpm scripts
├── .env.example
├── .env                             # Real secrets (gitignored)
├── .gitignore
├── README.md
└── PROJECT.md                       # ← This file
```

---

## Database Schema (Prisma)

5 models in `packages/db/prisma/schema.prisma`:

### Enums
- `IssueStatus`: OPEN | CLOSED | RESULT_PUBLISHED
- `ApplicationStatus`: PENDING | APPLYING | APPLIED | ALLOTTED | NOT_ALLOTTED | FAILED | SKIPPED
- `NotificationType`: NEW_IPO_OPEN | AUTO_APPLY_SUCCESS | AUTO_APPLY_FAILED | RESULT_ALLOTTED | RESULT_NOT_ALLOTTED

### Models
| Model | Key fields | Notes |
|-------|-----------|-------|
| **User** | id, email (unique), name, hashedPassword (bcrypt) | IPOPilot dashboard user |
| **MeroShareAccount** | id, userId, boid, dpId, dpName, encryptedPassword (AES-256-GCM), encryptionIv, encryptionTag, bankId, bankName, accountNumber, accountBranchId, crnNumber, customerId, isActive | Linked CDSC account; `@@unique([userId, boid])` |
| **IPOIssue** | id, companyShareId (unique, from CDSC), scrip, companyName, shareType, shareGroup, status, openDate, closeDate, issuePrice, minUnit, maxUnit, prospectusUrl | Upserted by `pollOpenIPOs` |
| **IPOApplication** | id, accountId, issueId, appliedKitta, appliedAt, status, allottedKitta, resultCheckedAt, errorMessage, retryCount | `@@unique([accountId, issueId])` |
| **Notification** | id, userId, type, title, body, isRead (default false) | User-facing alerts |

---

## API Routes

All under `/api/`. Responses follow `{ data, error }` envelope (type: `ApiResponse<T>` in `types/index.ts`).

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/accounts` | [Y] | List user's MeroShare accounts |
| POST | `/api/accounts` | [Y] | Add account (encrypts password, saves profile) |
| PATCH | `/api/accounts/[id]` | [Y] | Update account (bank details, toggle active, etc.) |
| DELETE | `/api/accounts/[id]` | [Y] | Delete account |
| GET | `/api/applications` | [Y] | List applications (optional `?status=`, `?page=`, `?size=`) |
| GET | `/api/ipos` | [Y] | List IPO issues |
| GET | `/api/ipos/[id]` | [Y] | Single IPO detail |
| GET | `/api/notifications` | [Y] | List notifications (`?limit=`) |
| GET/POST | `/api/proxy/meroshare/[...path]` | [Y] | CORS proxy to CDSC API (rate-limited: 30 req/min) |
| POST | `/api/register` | [N] | Create user (bcrypt, min 6 char password) |
| POST | `/api/auth/[...nextauth]` | [N] | NextAuth handler |
| GET | `/api/portfolio` | [Y] | Portfolio/allotment summary |

---

## CDSC Proxy Architecture

The browser **cannot call CDSC directly** due to CORS restrictions. All CDSC calls go through `/api/proxy/meroshare/[...path]`:

- **WAF bypass**: Adds browser-like headers (`User-Agent`, `Origin`, `Referer`)
- **Cookie forwarding**: Accumulates CDSC session cookies across requests (Set-Cookie → stored → sent as Cookie header on next call)
- **Auth token**: CDSC returns JWT in `Authorization` response header; proxy forwards it via `x-cdsc-token` custom header (since `Authorization` is CORS-protected)
- **Rate limiting**: 30 requests per minute per IP

### CDSC Endpoints Used (via `@ipopilot/meroshare-client`)
| Endpoint | Method | Auth | Used By |
|----------|--------|------|---------|
| `/auth/` | POST | [N] | AddAccount modal, worker login |
| `/capital/` | GET | [N] | DP list (seed, AddAccount dropdown) |
| `/companyShare/currentIssue` | GET | [Y] | pollOpenIPOs |
| `/active/:id` | GET | [Y] | Issue detail (optional) |
| `/ownDetail/` | GET | [Y] | Profile fetch (AddAccount, autoApply) |
| `/myBankRequest/` | GET | [Y] | Bank details (AddAccount, autoApply) |
| `/applicantForm/` | POST | [Y] | Submit application |
| `/applicantForm/active/search/` | POST | [Y] | Check results |

### CDSC Auth Quirk
CDSC uses raw JWT tokens (no "Bearer" prefix) in the `Authorization` header. The JWT is returned in the **response header** of `/auth/`, NOT in the response body (body is `{statusCode, message, ...}`).

---

## Encryption

MeroShare account passwords are encrypted with **AES-256-GCM** before storage:

- **Key**: 32 bytes (64 hex chars) from `ENCRYPTION_KEY` env var
- **IV**: 12 random bytes per encryption (hex-encoded)
- **Auth tag**: 16-byte GCM tag (hex-encoded) — detects tampering
- Stored as 3 columns: `encryptedPassword`, `encryptionIv`, `encryptionTag`
- Two identical implementations: `apps/web/src/lib/crypto.ts` and `apps/worker/src/crypto.ts`

---

## Environment Variables

See `.env.example` for full list. Key vars:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | [Y] | PostgreSQL connection string |
| `REDIS_HOST` / `REDIS_PORT` | [Y] | Redis connection |
| `ENCRYPTION_KEY` | [Y] | 64 hex chars (32 bytes) for AES-256-GCM. Generate: `openssl rand -hex 32` |
| `NEXTAUTH_SECRET` | [Y] | Random string for JWT signing |
| `NEXTAUTH_URL` | [Y] | Base URL of the web app |
| `NODE_ENV` | — | `development` / `production` |

---

## Scripts (root package.json)

```bash
pnpm dev              # Start all apps in dev mode (turbo dev)
pnpm build            # Build all packages + apps
pnpm db:migrate       # Run Prisma migrations
pnpm db:seed          # Fetch CDSC DP list
pnpm worker:dev       # Run worker standalone
pnpm worker:test-login # Test MeroShare login with env vars
```

---

## How to Run Locally

```bash
pnpm install
cp .env.example .env
# Fill in ENCRYPTION_KEY and NEXTAUTH_SECRET in .env
docker compose up -d         # Start PostgreSQL + Redis
pnpm db:migrate              # Run Prisma migrations
pnpm dev                     # Start web + worker
```

---

## Current State / Progress

### [Y] Complete
- [x] Monorepo setup (pnpm + Turborepo)
- [x] Database schema (Prisma + PostgreSQL)
- [x] NextAuth v4 (credentials provider, JWT sessions)
- [x] User registration + login UI
- [x] Dashboard layout (sidebar, topbar, mobile nav)
- [x] Overview page (stats, open IPOs, activity feed)
- [x] IPO listing + detail pages
- [x] Applications table with filters + error expansion
- [x] Portfolio page (allotment cards)
- [x] Accounts page (add, toggle, delete)
- [x] AddAccount modal (2-step: profile → bank details)
- [x] Settings page (display info, WIP password change/delete buttons)
- [x] `@ipopilot/meroshare-client` package (all CDSC endpoints typed)
- [x] CDSC CORS proxy with WAF bypass headers + cookie forwarding
- [x] AES-256-GCM encryption (identical in web + worker)
- [x] Worker entry point (BullMQ worker + cron scheduler)
- [x] `autoApply` BullMQ job (login, bank fetch, submit, notify)
- [x] `pollOpenIPOs` cron job (detect issues, create applications, enqueue)
- [x] `checkResults` cron job (check allotment results)
- [x] Notification service
- [x] Docker Compose (PostgreSQL + Redis)
- [x] Dark mode UI (#0A0A0A base)

###  In Progress / Partially Done
- [ ] Password change in Settings (UI exists, no API route wired)
- [ ] Delete account / Remove all accounts (UI exists, no API route wired)
- [ ] `@ipopilot/ui` shared package (package.json + tsconfig exist, **no source files**)
- [ ] Bank API endpoint (`/bank/`) — AddAccount modal fetches it but CDSC may not have it
- [ ] `customerId` field — fetched by worker but may not be populated for all accounts
- [ ] Proper error handling for CDSC 403/429 edge cases (WAF blocking needs more testing)

### [N] Not Yet Started
- [ ] Tests (no test suite yet — vitest configured in meroshare-client but no test files)
- [ ] Production deployment config
- [ ] Email verification
- [ ] Admin panel
- [ ] Multi-user concurrency testing
- [ ] Rate limiting on worker CDSC calls

---

## Known Issues / Gotchas

1. **CDSC WAF is aggressive**: Blocks server-side requests that don't look like browser traffic. The proxy adds browser-like headers and forwards cookies. `/myBankRequest/` is especially sensitive.
2. **CDSC auth token in header, not body**: `MeroShareClient.login()` extracts the JWT from the `Authorization` response header. The body only contains `{statusCode, message, ...}`.
3. **No "Bearer" prefix**: CDSC expects the raw JWT token in the Authorization header.
4. **Duplicate `crypto.ts`**: Both `apps/web` and `apps/worker` have identical AES-256-GCM implementations. Should be moved to a shared package.
5. **ENCRYPTION_KEY must be 64 hex chars exactly**: The worker validates this at startup and exits if invalid.
6. **Bank details fetch race condition**: `autoApply` fetches bank details via CDSC if missing, but CDSC may block `/myBankRequest/` for some accounts. The worker falls back gracefully.
7. **Session verification**: `requireSession()` re-checks the user exists in DB to catch stale sessions after DB resets.
8. **Mobile responsive**: Bottom nav appears on mobile; sidebar hidden. `pb-20 md:pb-6` on main content to account for mobile nav.

---

## Update Log

| Date | Change |
|------|--------|
| 2026-06-25 | Created PROJECT.md — initial comprehensive documentation |
| — | *(add future entries here)* |

---

> **Instructions for Claude**: Read this file at the start of every session. Update it after making meaningful code changes (new features, bug fixes, refactors, schema changes, etc.). Add entries to the Update Log. If `@ipopilot/ui` gets source files, update the File Tree and Current State sections.
