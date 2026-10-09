# AI WhatsApp -> CRM -> ERP

Demo integration platform: a WhatsApp/Telegram-style message becomes a
webhook, an LLM (or deterministic fallback) extracts intent, typed tools
persist an order to PostgreSQL with a full audit trail, and a real
`sale.order` can be written to Odoo. Dashboard: Next.js. Bot: Telegram live.

Live demo: https://crm-djaouad.netlify.app/try · Bot: https://t.me/DjaouadcrmBot

## 60-second demo (local)

```bash
docker compose up -d                      # postgres, redis, odoo
cd apps/backend && ../../node_modules/.bin/tsx src/main.ts   # :3000
cd apps/frontend && ../../node_modules/.bin/next dev -p 3001 # :3001
```

```bash
# 1. ingest a customer message (idempotent by payload id)
curl -X POST http://localhost:3000/webhooks/whatsapp -H 'content-type: application/json' \
  -d '{"id":"demo-1","timestamp":"2026-10-09T00:00:00Z","from":"+213555000001","to":"demo","text":"I want 2x Product A","status":"delivered"}'
# 2. run the order workflow (intent -> stock check -> order -> reply)
curl -X POST http://localhost:3000/api/orders/webhooks/<webhookEventId>/process
# 3. read the thread (inbound + assistant reply in one conversation)
curl http://localhost:3000/api/conversations/<conversationId>/messages
# 4. duplicate delivery -> {"deduplicated":true}, exactly one order
# 5. low stock ("I want 99 units of Product C") -> structured error, no order
```

Proof docs: [E2E matrix](docs/DEMO-PROOF.md) · [Odoo write](docs/ODOO-PROOF.md)

## Stack

| Layer    | Tech                                  |
| -------- | ------------------------------------- |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend  | NestJS 11 + TypeScript (Express)      |
| ORM      | TypeORM 0.3 (NestJS `@nestjs/typeorm`) |
| ERP      | Odoo 17                               |
| Data     | PostgreSQL 16, Redis 7               |

## Ports

| Service    | Host port | Container port | Purpose                |
| ---------- | --------- | -------------- | ---------------------- |
| Frontend   | `3001`    | `3000`         | Next.js app            |
| Backend    | `3000`    | `3000`         | NestJS API             |
| Odoo       | `8069`    | `8069`         | ERP                    |
| PostgreSQL | `5432`    | `5432`         | CRM + Odoo DB          |
| Redis      | `6379`    | `6379`         | Cache / queue / state  |

## Mock WhatsApp Gateway (Phase 4)

A Next.js-style customer chat UI that simulates sending WhatsApp messages.
Inbound messages POST to the backend webhook and are persisted as
`WebhookEvent` + `Message` rows.

### UI

- Route: `apps/frontend/src/app/chat/page.tsx` (+ `Chat.tsx`)
- Env: `NEXT_PUBLIC_BACKEND_WEBHOOK_URL` (default
  `http://localhost:3000/webhooks/whatsapp`)
- Features: text input, simulated `queued|delivered|failed` status, a
  **Simulate delivery failure** toggle, and a live HTTP response pane.

### Backend

- `POST /webhooks/whatsapp` — `apps/backend/src/webhooks/webhooks.controller.ts`
- Validates the payload `{ id, timestamp, from, to, text, status }`
  (400 on invalid) and persists a `WebhookEvent` row **idempotent by
  `payload.id`** (unique `source + externalEventId`). Duplicate deliveries
  are recorded as `duplicate` and never re-processed.
- Wires the `Message` entity: an inbound `Message` row is created and its
  `Conversation` thread is upserted (`wa:<from>:<to>`).
- Module: `apps/backend/src/webhooks/webhooks.module.ts`, wired into
  `AppModule`.

### Try it

```bash
# backend
curl -X POST http://localhost:3000/webhooks/whatsapp \
  -H 'Content-Type: application/json' \
  -d '{"id":"wa-1","timestamp":"2026-10-07T21:11:46Z","from":"+15551234567","to":"+15550000000","text":"Hello","status":"delivered"}'

# duplicate delivery → idempotent (200, deduplicated: true)
curl -X POST http://localhost:3000/webhooks/whatsapp \
  -H 'Content-Type: application/json' \
  -d '{"id":"wa-1","timestamp":"...","from":"+15551234567","to":"+15550000000","text":"Hello","status":"delivered"}'
```

> Phase 4 — Mock WhatsApp gateway + webhook ingestion. No AI orchestration
> yet (Phase 6).

## Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
2. Build and run the full stack:
   ```bash
   docker compose up --build
   ```
3. Health endpoints:
   - Backend: `http://localhost:3000/health`
   - Frontend: `http://localhost:3001/`
   - Odoo: `http://localhost:8069/`

## Domain model (Phase 2)

Local CRM state is stored in PostgreSQL and is **separate from Odoo**.
The local DB is the system of record for the order workflow; Odoo is a
downstream projection reconciled through the outbox.

| Entity              | Local state | Odoo mirror         | Notes                                            |
| ------------------- | ----------- | ------------------- | ------------------------------------------------ |
| `Customer`          | yes         | `res.partner`       | `odooId` is the reconciliation key               |
| `Product`           | yes         | `product.template`  | `stockQuantity` is the local inventory view      |
| `Order`             | yes         | `sale.order`        | `local_orders` mirror; status gates the sync     |
| `OrderItem`         | yes         | `sale.order.line`   | `unitPrice` is a snapshot, not a live reference  |
| `Conversation`      | yes         | -                   | WhatsApp thread; CRM owns it                     |
| `Message`           | yes         | -                   | `externalId` dedups inbound webhook events       |
| `IntegrationEvent`  | yes         | -                   | Transactional outbox for Odoo pushes             |
| `WebhookEvent`      | yes         | -                   | Inbound webhook record + dedup key               |
| `ApprovalRequest`   | yes         | -                   | Human sign-off before Odoo sync                  |
| `AuditLog`          | yes         | -                   | Append-only audit trail                          |

### Seed

```bash
# inside apps/backend
npm run seed
```

Idempotent upserts (matched by `phone` / `sku`):

- Customers: **Ahmed**, **Sara**, **Company Customer**
- Products: **Product A** (5 in stock, $9.99), **Product B** (50, $19.99),
  **Product C** (500, $49.99)

### Migrations

```bash
npm run migration:run    # apply pending migrations
npm run migration:revert # roll back the last one
```

In development the app also uses `synchronize: true` so the schema is created
on startup; migrations are the source of truth for production.

## Structure

```
apps/
  frontend/      # Next.js + TS + Tailwind
    src/app/chat/ # Mock WhatsApp gateway UI (Phase 4)
  backend/       # NestJS + TS
    src/
      app.module.ts
      main.ts
      webhooks/    # WebhooksModule + POST /webhooks/whatsapp (Phase 4)
      database/
        entities/           # 10 TypeORM entities
        migrations/         # schema migrations
        database.module.ts  # TypeOrmModule wiring
      health/             # liveness probe
      seed.ts             # idempotent seed
docker-compose.yml
.env.example
README.md
```

> Phase 2 — PostgreSQL + TypeORM domain model. Local and Odoo state are
> intentionally separated; `local_orders` mirror the Odoo `sale.order`.