# Odoo live-write proof (2026-10-09)

Script: `backend/src/odoo/verify-odoo.ts`
(run: `cd backend && source .env && ../../node_modules/.bin/tsx src/odoo/verify-odoo.ts`)

Prereqs proven in-session: Odoo 17 container with `sale_management` + `stock`
installed (`odoo -d odoo -i sale_management,stock`), admin password set via
`admin_passwd` in `odoo.conf`.

## Result
```
ping: true
partner exists: 41 Demo Proof Customer
product: 37 Customizable Desk 750
sale.order created: 25
sale.order read-back: {"id":25,"name":"S00025","state":"sale","amount_total":1725}
ODOO-PROOF-OK {"partnerId":41,"productId":37,"orderId":25,"name":"S00025","state":"sale"}
```

A real `sale.order` (**S00025**, state `sale`, total 1725) exists in the local
Odoo for partner 41. This is a genuine ERP write through the typed
JSON-RPC client — not a simulation.
