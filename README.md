# IPOPilot

IPOPilot is an open source web dashboard meant to automatically apply for IPOs on MeroShare, the online portal of Nepal's Central Depository System and Clearing Limited (CDSC). A user links one or more MeroShare accounts, and a background worker is supposed to notice when a new share issue opens, submit an application on the user's behalf, and later check whether shares were allotted.

> This project has no affiliation with CDSC, MeroShare, NEPSE, or any Nepali government body. It is an independent, unofficial client built by reverse engineering the public MeroShare web app.

## Project status: unfinished

This project is not complete and is not safe to run against a real MeroShare account in its current state, even though the production build itself is clean as of this writing.

### The real reason

CDSC does not publish an API. Everything this project does against MeroShare is reverse engineered from the network traffic of the official web app, and CDSC's backend is defended by a web application firewall that treats any request that does not look like it came from a real browser as an attack:

1. The first version of this project called MeroShare's endpoints directly from the server (the worker process and Next.js API routes). CDSC's firewall blocked most of that traffic outright.
2. The next version added a proxy that forwards requests through the browser with spoofed browser headers, forwarded cookies, and manual handling of CDSC's unusual auth flow (the session token comes back in a response header, not the response body, and is used without a "Bearer" prefix). This got login, account setup, and submitting an application working, but two endpoints remained blocked no matter what: the list of currently open issues (`/companyShare/active`) and portfolio holdings (`/portfolio/`). Both consistently return a firewall challenge page instead of data when called by anything other than a real, human driven browser session.
3. To route around that, a third version was started: instead of asking MeroShare which issues are open, a worker job scrapes CDSC's separate public issue tracker page (`cdsc.com.np/ipolist`), which is not behind the same firewall. That page is missing a few fields MeroShare's internal API would have provided (the internal company share ID and the per applicant minimum and maximum unit), so the plan was to detect an issue automatically, notify the user, and have them fill in those three remaining fields by hand before the rest of the pipeline (applying, notifying, checking results) ran automatically.

That third pivot is the one in progress when work stopped. A new database model (`DetectedIssue`), a new worker job, several new API routes, and a rebuilt dashboard layout were all added, but never committed, and the previous portfolio page and its supporting components were deleted without the rest of the migration being finished. Based on file timestamps in this working copy, active development trailed off in early July 2026 and nothing had been touched since, until this pass. In short: the project ran into a wall that had no clean workaround, spent its remaining effort on an unfinished detour around that wall, and stopped partway through.

Separately from any of that, the production build itself was also broken: `pnpm build` failed with a type error in the NextAuth route, reported as "Route does not match the required types of a Next.js Route." The actual cause had nothing to do with CDSC. `apps/web/next-auth.d.ts`, present since the project's first commit, is a hand written type declaration that fully redeclares the `next-auth` module (its `NextAuth` function, `AuthOptions`, `CredentialsProvider`, `getToken`, and more) instead of narrowly extending it the way next-auth's own documentation recommends. That hand written file invented an incorrect return shape for `NextAuth()`, an object with `GET` and `POST` methods, that does not match what the installed `next-auth` package actually returns, a single callable request handler, and Next.js's build time route checker was correctly rejecting the mismatch. That has been fixed here by replacing the file with a minimal, standard augmentation that only adds the one field (`id` on `Session.user`) that next-auth does not type by default, and otherwise leaving next-auth's own, correct types alone. The build is clean now, which at least means the parts of this list that are marked working below can actually be deployed.

### What is concretely unfinished

* The pivot to public page scraping and manual issue completion is implemented on the backend (worker job, detected issues table, API routes) but the frontend flow for a user to see a detected issue and fill in the missing fields does not appear to be fully wired to those routes.
* `packages/ui`, the intended shared component package, has never had any source files added.
* No automated tests exist anywhere in the repository, despite Vitest being configured in `packages/meroshare-client`.
* There is no production deployment configuration (no Dockerfile for the app itself, no process manager config for the worker, nothing for a hosting provider).
* Email verification, an admin panel, and any kind of abuse or rate limiting on the worker's own calls to CDSC were never started.
* Multi user behavior has not been tested beyond local, single user development.

## What this project set out to do

* Let a user register, then link one or more MeroShare accounts (BOID, depository participant, password, and MeroShare transaction PIN) to the dashboard.
* Detect newly opened IPO, FPO, and rights issues.
* Automatically submit an application for every linked, active account when an issue opens, using each account's saved minimum unit and transaction PIN.
* Notify the user of successes, failures, and eventual allotment results.
* Show a dashboard overview, an IPO list, an application and allotment history, linked accounts, and account settings.

## What actually works today

| Area | Status | Notes |
|---|---|---|
| Registration and login | Working | NextAuth credentials provider, bcrypt hashed passwords, JWT sessions. |
| Linking a MeroShare account | Working | Two step modal: fetch profile from MeroShare through the CORS proxy, then bank details. Password and transaction PIN are encrypted before storage. |
| Submitting an application | Working | Once an `IPOIssue` row exists (however it got there), the worker logs in and submits for every linked active account. |
| Checking allotment results | Working | Cron job searches CDSC's application history for accounts with applied, unresolved applications. |
| Automatic issue detection from MeroShare itself | Blocked by CDSC | The endpoint is firewalled for non browser clients; there is no code fix for this short of driving a real browser, which is not implemented. |
| Automatic issue detection from the public issue tracker page | Partly built | Worker job and database model exist; the frontend flow to complete a detected issue is not confirmed to be finished. |
| Manual issue entry | Working | A user can fill in a new issue's details by hand from the IPOs page; this immediately queues applications for every active account system wide, not just the user who entered it. |
| Password change and account deletion | Working | Both have real API routes wired to the Settings page. |
| Portfolio holdings | Blocked by CDSC | Same firewall issue as issue detection; there is no workaround in place. |
| Analytics and history dashboard widgets | Recently added, unverified | Sparkline stat cards, a donut chart, and a bar chart were added to the overview page; not confirmed working end to end. |
| Shared UI package (`packages/ui`) | Not started | Package scaffold only, no components. |
| Tests | Not started | No test files exist. |

## Architecture

```
apps/web      Next.js 14 (App Router) dashboard and API routes
apps/worker   Node.js background process: BullMQ job worker plus a node cron scheduler
packages/db               Prisma schema and a shared PrismaClient singleton
packages/meroshare-client Typed HTTP client for MeroShare's unofficial API
packages/ui               Shared UI components (scaffold only, unused)
```

Data flow, when everything is working:

1. A user registers, then adds a MeroShare account. The browser talks to MeroShare through `apps/web`'s CORS proxy (`/api/proxy/meroshare/...`), which adds browser like headers and forwards cookies so CDSC's firewall does not reject the request. The account's password and transaction PIN are encrypted and stored.
2. A worker job (or, in the current partly finished design, a public page scrape plus manual completion) creates an `IPOIssue` row for a newly opened issue.
3. For every active account, a `PENDING` `IPOApplication` row is created and a job is queued in BullMQ.
4. The `autoApply` worker job decrypts the account's credentials and transaction PIN, logs into MeroShare, fetches bank details if missing, and submits the application, marking it `APPLIED` or `FAILED`.
5. Once an issue's close date has passed, a scheduled job checks MeroShare's application history and updates status to `ALLOTTED` or `NOT_ALLOTTED`, and a notification is created either way.
6. The dashboard polls the API routes with SWR and renders stats, tables, and an activity feed.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS 3, SWR |
| Auth | NextAuth.js v4, credentials provider, JWT sessions |
| Database | PostgreSQL 16 via Prisma 5 |
| Queue | BullMQ on Redis |
| Scheduler | node cron |
| Worker runtime | tsx in development, tsup for building, plain Node.js in production |
| MeroShare client | Hand written, typed HTTP client (`packages/meroshare-client`) |
| Encryption | AES 256 GCM (Node's built in `crypto` module) for stored passwords and transaction PINs |
| Monorepo tooling | pnpm workspaces, Turborepo |
| Local infrastructure | Docker Compose (PostgreSQL, Redis) |
| Language | TypeScript, strict mode |

## Database schema

Six models in `packages/db/prisma/schema.prisma`:

| Model | Purpose |
|---|---|
| `User` | Dashboard account: email, bcrypt hashed password. |
| `MeroShareAccount` | A linked MeroShare login: BOID, depository participant, encrypted password, encrypted transaction PIN, bank details. |
| `IPOIssue` | A confirmed, actionable issue with all fields needed to apply. |
| `DetectedIssue` | An issue seen on CDSC's public tracker page but missing the fields needed to actually apply; waiting on a user to complete it. |
| `IPOApplication` | One application attempt tying an account to an issue, with status and allotment outcome. |
| `Notification` | In app notifications for opens, application outcomes, and allotment results. |

## Getting started

Requirements: Node 20 or newer, pnpm 9, and Docker (for PostgreSQL and Redis).

```bash
pnpm install
cp .env.example .env
# Fill in ENCRYPTION_KEY and NEXTAUTH_SECRET in .env
docker compose up -d
pnpm db:migrate
pnpm dev
```

Then register a user, and add a MeroShare account (including its transaction PIN) from the Accounts page.

`pnpm build` now succeeds, but that only means the code compiles. Expect the parts described above as blocked or partly built to not work regardless.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `REDIS_HOST`, `REDIS_PORT` | Yes | Redis connection, used by BullMQ. |
| `ENCRYPTION_KEY` | Yes | 64 hex characters (32 bytes). Generate with `openssl rand -hex 32`. Encrypts stored MeroShare passwords and transaction PINs; the worker refuses to start without a validly formatted key. |
| `NEXTAUTH_SECRET` | Yes | Any random string, used to sign session JWTs. |
| `NEXTAUTH_URL` | Yes | Base URL of the web app, for example `http://localhost:3000`. |
| `NODE_ENV` | No | `development` or `production`. |

## Security considerations

This project stores, encrypted, both a user's MeroShare password and their transaction PIN, because the transaction PIN is required to actually submit an application. That is meaningfully more sensitive than a typical password vault: a transaction PIN is a financial credential, and having both a MeroShare password and its transaction PIN in one place is close to holding full control over a brokerage style account. Before running this against a real account, be aware that:

* The code has not had any security review or audit.
* Encryption uses a single symmetric key (`ENCRYPTION_KEY`) for every account in the database; anyone with that key and database access can decrypt every stored password and PIN.
* There is no rate limiting on the worker's own calls to CDSC, and no monitoring for unusual account activity.
* The project is, as described above, not finished, and unfinished code is more likely to contain mistakes that matter a great deal when the data involved is a banking transaction PIN.

Treat this as a personal, local project to run against a test or low value account, not as something to deploy for other people to trust with their credentials, at least not without a proper review first.

## Known limitations

1. CDSC's firewall blocks any server side request to `/companyShare/active` (open issue listing) and `/portfolio/` (holdings) that does not look like a real browser. There is no fix in this codebase short of driving an actual browser, which is not implemented.
2. CDSC's login response returns its session token in an `Authorization` response header rather than in the response body, and expects that raw token back with no "Bearer" prefix. Browsers cannot read that header across origins, so the CORS proxy re exposes it under a custom header.
3. `/applicantForm/active/search/` (used to look up existing applications) intermittently returns HTTP 500; it is unclear whether this is account specific or a bug on CDSC's side.
4. The AES 256 GCM encryption logic is duplicated between `apps/web` and `apps/worker` instead of living in one shared package.
5. `ENCRYPTION_KEY` must be exactly 64 hex characters; the worker validates this at startup and exits if it is not.
6. Because MeroShare's API is unofficial and undocumented, it can change or break at any time without notice, and has no changelog or support channel to watch for that.

## Naming history

This project has gone by three names. It started as IPOBharuwa (Bharuwa, a porter, someone who carries a load for you), then for most of its life the code and UI text called it IPOBaje (Baje, a colloquial word for an elder, "the old man who takes care of things") while the GitHub repository itself stayed on the older name, so the two disagreed for a while. It is now IPOPilot everywhere: the repository, every package name, and the dashboard's own text. The new name leans on the same idea Getting started describes, you handle the one manual step, it flies the rest on autopilot, and it does not need a reader to already know any Nepali to make sense of it.

## Contributing

Contributions, especially anything that makes issue detection or portfolio fetching work without hitting CDSC's firewall, or that finishes the detected issue completion flow, are welcome.

## License

MIT. See [LICENSE](./LICENSE).
