# IPOBaje

Open-source web dashboard that automatically applies for IPOs on MeroShare (Nepal's CDSC stock platform) in the background.

>  This project has no affiliation with CDSC, MeroShare, or NEPSE.

## Setup

```bash
pnpm install
cp .env.example .env
# Fill in ENCRYPTION_KEY and NEXTAUTH_SECRET in .env
docker compose up -d
pnpm db:migrate
pnpm dev
```
