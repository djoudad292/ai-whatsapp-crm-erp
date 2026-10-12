# AI WhatsApp CRM/ERP

An AI agent that **reads WhatsApp messages**, **checks stock**, **creates orders**, and **replies to the customer** — with a dashboard for humans to review every conversation, order and approval.

**Live demo:** [crm.djaouad.is-a.dev](https://crm.djaouad.is-a.dev) · [Try it with no signup](https://crm.djaouad.is-a.dev/try)

## Architecture

```
┌───────────────────────────────────────────────┐
│          Frontend (Next.js 14, static export)   │
│   /try  ·  /dashboard  ·  /orders  ·  /chat     │
│   /conversations  ·  /approvals  ·  /audit      │
└───────────────────┬───────────────────────────┘
                    │  REST  (+  Netlify redirect)
┌───────────────────▼───────────────────────────┐
│      Backend (NestJS) — Netlify Function       │
│   Webhooks · Agent · Tools · Orders            │
│   Approvals · Audit · Delivery (WhatsApp API)   │
└───────────────────┬───────────────────────────┘
                    │  SQL
┌───────────────────▼───────────────────────────┐
│            Postgres on Neon (external)         │
│  conversations │ messages │ customers │ products │
│  orders │ order_items │ webhook_events │ audit  │
└───────────────────────────────────────────────┘
```

The backend is a **single stateless function**. There is no long-lived server and no
in-memory queue: every request boots the app (warm-started), reads Postgres, and
returns. Outbound WhatsApp delivery is attempted **inline** and retried from the
`messages` table itself — see [Delivery](#delivery-without-a-queue-worker) below.

## Features

- **Inbound webhook ingest** — Meta retries webhooks, so every event is deduplicated
  on `(source, externalEventId)` before it touches the database.
- **Threading** — messages group into one conversation per customer (`wa:<from>:<to>`).
- **Agent + tool registry** — the LLM never gets raw DB access. It can only invoke a
  fixed set of tools (`createOrder`, `checkStock`, `sendCustomerMessage`), so a
  hallucination cannot drop your tables.
- **Transactional ordering** — stock is re-checked *inside* the transaction that
  writes the order, so two customers racing for the last item cannot both win.
- **Real WhatsApp delivery** — Cloud API client with correct retry classification
  (see below), persisted `wamid` for idempotency.
- **Approvals & audit** — high-value actions wait for a human sign-off; every tool
  call is written to an append-only audit log.
- **Metrics** — conversations, messages sent, delivery outcomes.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14 (static export), TailwindCSS, TypeScript |
| Backend  | NestJS 11, TypeScript, TypeORM |
| Database | Postgres 18 on **Neon** (works with any Postgres) |
| Messaging | WhatsApp Cloud API (Graph), Telegram Bot API |
| Hosting   | Netlify (frontend + function) + Neon |

## Delivery without a queue worker

Serverless hosts cannot run a BullMQ worker — it needs a long-lived process. So the
`messages` table *is* the queue:

| Outcome | Result |
|---------|--------|
| Success | `status = sent`, `externalId` = the `wamid` |
| Retryable (rate limit, 5xx, timeout) | stays `queued`, exponential backoff capped at 30 min |
| Permanent (undeliverable, bad token) | `status = failed` immediately, never retried |
| No credentials | stays `queued` — **the message is never dropped** |

`POST /api/delivery/drain` is the retry pass. Point any scheduler at it.

## Quick Start

```bash
git clone https://github.com/djoudad292/ai-whatsapp-crm-erp.git
cd ai-whatsapp-crm-erp
npm install
```

### 1. Database

Any Postgres works. On Neon, run the migrations:

```bash
cd backend
npm run build
node dist/database/run-migrations.js run   # note: run from dist/, not tsx
node dist/seed.js                           # optional demo catalogue
```

> The migration runner globs `migrations/*.js`, so it must run against the compiled
> output. Running it through `tsx` finds zero migrations and **reports success while
> creating nothing** — that trap is already fixed in `npm run migrate`.

### 2. Backend

```bash
cd backend
cp .env.example .env     # fill DATABASE_URL etc.
npm run dev              # http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env     # NEXT_PUBLIC_API_URL=http://localhost:3000
npm run dev
```

### Docker

```bash
docker compose up --build    # postgres + redis + odoo + backend + frontend
```

## Deployment

| Piece | Host |
|-------|------|
| Frontend + API function | **Netlify** (see `netlify.toml`) |
| Database | **Neon** or any Postgres |

The Netlify function reads its config from `.env` at build time via
`scripts/build-function-config.mjs`, which writes a **gitignored** file that gets
bundled. Credentials therefore never enter the repository — a pre-commit guard
(`scripts/guard-secrets.mjs`) blocks any credential-shaped string from being staged.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/whatsapp` | Inbound message (deduplicated) |
| POST | `/webhooks/telegram` | Inbound Telegram message |
| POST | `/api/orders/webhooks/:id/process` | Run the agent over a captured message |
| GET  | `/api/conversations` | List conversations |
| GET  | `/api/conversations/:id/messages` | Thread with delivery status |
| GET  | `/api/orders` | List orders |
| POST | `/api/delivery/drain` | Retry queued outbound messages |
| GET  | `/api/metrics` | Counters |
| POST | `/api/auth/login` | Single-admin login |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `DATABASE_SSL` | For Neon/managed | `true` to require TLS |
| `AUTH_SECRET` | Yes | Session signing secret |
| `LLM_BASE_URL` | Optional | OpenAI-compatible endpoint |
| `LLM_API_KEY` | Optional | Enables the LLM path |
| `LLM_MODEL` | Optional | Model id |
| `WHATSAPP_PHONE_NUMBER_ID` | For sending | Cloud API phone number id |
| `WHATSAPP_ACCESS_TOKEN` | For sending | Cloud API bearer token |
| `QUEUES_ENABLED` | No | `true` to load BullMQ (needs Redis) |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram channel |

> With no `LLM_*` configured the agent runs a **deterministic intent parser**, not an
> LLM. It still handles ordering reliably, but free-form questions will not be
> understood. This degradation is logged rather than silent.

## Tests

```bash
cd backend
npm test          # delivery semantics: retryable vs permanent, backoff, exhaustion
npm run typecheck
```

## Security

- `.env` is gitignored and blocked by a pre-commit secret scanner.
- The agent is tool-gated: no raw query surface.
- Webhook endpoints are **not** authenticated — add a shared-secret check before
  exposing them publicly.
- `/api/delivery/drain` triggers real sends; guard it with a token in production.

---

Built by [Djaouad Frih](https://djaouad.is-a.dev) — [djaouad.is-a.dev](https://djaouad.is-a.dev)