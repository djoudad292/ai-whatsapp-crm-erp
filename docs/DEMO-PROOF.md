# Demo proof — E2E verification (2026-10-09)

Run against the local stack (`docker compose up`, NestJS on :3000, Postgres :5433).
Catalog at proof time: A-001 stock 98, B-001 stock 10, C-001 stock 3
(`PROD-*` duplicates from early scaffolding set `isActive=false` so the
real catalog is authoritative; their historic order rows are untouched).

## T1 — WhatsApp order, sufficient stock ✅
`POST /webhooks/whatsapp` `{text: "I want 1x Product B"}` →
`POST /api/orders/webhooks/:id/process` →
`{"success":true,"orderId":"97d6ebf3-…","intent":"order","items":[{…,"quantity":1}]}`

## T2 — Duplicate webhook ✅
Same payload `id` posted twice → second returns
`{"status":"ok","deduplicated":true,…}` — one logical order.

## T3 — Insufficient inventory ✅
`{text: "I want 99 units of Product C"}` →
`{"success":false,"error":"Insufficient inventory for Product C. Requested: 99, Available: 3."}`
No order row created; customer receives the same text as a reply.

## T4 — Telegram order, fully automatic ✅
Simulated Bot API update → `/webhooks/telegram` stores + auto-processes
(no manual process call) → order row + outbound confirmation row in the
same `tg:770011` thread. Live Bot API delivery is best-effort
(`sendMessage`, failures stay `queued` + audited, never break the flow).

## T5 — Live channels ✅
- Telegram webhook set: `…trycloudflare.com/webhooks/telegram` (`getWebhookInfo ok`)
- Bot: https://t.me/DjaouadcrmBot
- Dashboard: https://crm-djaouad.netlify.app/dashboard (API base = tunnel URL)
- Backend: `GET /health → {"status":"ok"}`, `GET /api/health/odoo → reachable`

## Known demo limits (not re-verified here)
- Real `sale.order` write into Odoo (client typed + pinged only).
- BullMQ retry path under a forced failure.
- Metrics counters are in-memory (reset on restart).
