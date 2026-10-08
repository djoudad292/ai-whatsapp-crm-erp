# Implementation Plan — AI WhatsApp → CRM → ERP Platform

## Assumptions
- Repo: ~/ai-whatsapp-crm-erp (git initialized)
- Stack: Next.js (frontend), NestJS (backend), PostgreSQL, Redis/BullMQ, Odoo Community in Docker, TypeScript everywhere
- LLM: env-selected provider (OpenAI-compatible + local Ollama fallback); never hard-coded
- Mock WhatsApp gateway first; real WhatsApp interface stubbed behind an adapter
- Money/clients goal: project doubles as the "integration engineering" portfolio piece from outreach templates

## Phase 1 — Repo + architecture + Docker (now)
- Monorepo layout: apps/frontend, apps/backend, services/odoo (docker), packages/shared
- docker-compose: postgres, redis, odoo+db, backend, frontend; documented ports
- .env.example, README skeleton

## Phases 2–14 — per brief, incrementally via `kilo run`
2 DB+domain · 3 Odoo API · 4 mock WhatsApp · 5 webhooks · 6 AI orchestration+tools · 7 order workflow · 8 queues/retries/idempotency · 9 auth/RBAC · 10 audit+observability · 11 dashboard · 12 tests · 13 docs · 14 self-review

## Non-goals (explicit)
- No real WhatsApp Cloud API wiring (adapter interface only)
- No Payments/Stripe beyond a simulated refund artifact
- Not "production-ready" until the mandatory self-review scores it so
