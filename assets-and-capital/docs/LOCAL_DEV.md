# Running locally with Docker Postgres

The app talks to Postgres through Prisma. Locally that Postgres runs in Docker;
in production it's Supabase. Same schema, same migrations, same code.

## One-time setup

Requires **Node 22** (`.nvmrc`) and **Docker Desktop** running.

```bash
git clone https://github.com/CobbyNelson/bootstrap.git
cd bootstrap/assets-and-capital
npm install
cp .env.example .env.local     # then set AUTH_SECRET (see below)
npm run db:setup               # starts Postgres, migrates, seeds
npm run dev                    # http://localhost:3000
```

`db:setup` is the shortcut for `db:up` → `db:migrate` → `db:seed`.

### AUTH_SECRET

Sessions are signed, so this must be set or sign-in fails:

```bash
openssl rand -base64 32
```

Paste the result into `.env.local` as `AUTH_SECRET`.

### Database URLs

`.env.example` already points at the Docker container:

```
POSTGRES_PRISMA_URL="postgresql://ac:ac_local_dev@localhost:5433/assets_and_capital"
POSTGRES_URL_NON_POOLING="postgresql://ac:ac_local_dev@localhost:5433/assets_and_capital"
```

Port **5433** on the host (not 5432) so it can't collide with a Postgres you
already run. The variable names match the Vercel↔Supabase integration, so one
schema works in both places with no code change.

## Seeded accounts

All use password **`password123`**:

| Email | Role | State |
|---|---|---|
| `admin@assetsandcapitalltd.com` | SUPER_ADMIN | Can reach `/admin` |
| `investor@example.com` | INVESTOR | Subscribed, interest + NDA on Sahara Solar Grid, KYC verified |
| `business@example.com` | BUSINESS | Business dashboard |

Sign in as the investor to see the full access ladder unlocked; sign out to see
the same pages gated.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run db:up` | Start Postgres |
| `npm run db:down` | Stop it (data kept in the volume) |
| `npm run db:reset` | Destroy the volume and start clean |
| `npm run db:migrate` | Apply migrations (`migrate deploy`) |
| `npm run db:migrate:dev` | Create a new migration after editing the schema |
| `npm run db:seed` | Re-seed (idempotent) |
| `npm run db:studio` | Prisma Studio, a GUI over the data |

## Changing the schema

1. Edit `prisma/schema.prisma`
2. `npm run db:migrate:dev -- --name what_changed`
3. Commit the generated folder in `prisma/migrations`

Vercel runs `prisma migrate deploy` during its build, so a merged migration
applies to production on the next deploy.

## Troubleshooting

**`AUTH_SECRET is not set`** — set it in `.env.local` and restart `npm run dev`.

**Port 5433 already in use** — change the host side of the mapping in
`docker-compose.yml` (`"5434:5432"`) and update both URLs in `.env.local`.

**Migrations won't apply** — check the container is healthy with
`docker compose ps`; `npm run db:reset` gives you a clean database.

**Schema drift after switching branches** — `npm run db:reset && npm run db:setup`.
