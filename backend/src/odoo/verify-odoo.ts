/**
 * Odoo live-write proof (run manually, not in CI).
 *
 * Usage: ../../node_modules/.bin/tsx src/odoo/verify-odoo.ts
 * Requires ODOO_URL/ODOO_DB/ODOO_USER/ODOO_PASSWORD in env.
 *
 * Does a real round-trip: res.partner upsert -> product lookup ->
 * sale.order create -> confirm -> read back. Prints the Odoo IDs.
 */
import { OdooClient } from "./odoo.client";
import { resolveOdooConfig } from "./odoo.config";

const cfg = resolveOdooConfig({
  get: (k: string) => process.env[k],
} as any);

async function main() {
  const client = new OdooClient(cfg);
  const ok = await client.ping();
  console.log("ping:", ok);

  // 1. partner upsert
  const found: any[] = await client.call(
    "res.partner",
    "search_read",
    [[["email", "=", "demo-proof@example.com"]]],
    { fields: ["id", "name"], limit: 1 },
  );
  let partnerId: number;
  if (found.length > 0) {
    partnerId = found[0].id;
    console.log("partner exists:", partnerId, found[0].name);
  } else {
    partnerId = await client.call("res.partner", "create", [
      { name: "Demo Proof Customer", email: "demo-proof@example.com", phone: "+213555000001" },
    ]);
    console.log("partner created:", partnerId);
  }

  // 2. product lookup (first saleable product)
  const products: any[] = await client.call(
    "product.product",
    "search_read",
    [[["sale_ok", "=", true], ["type", "=", "product"]]],
    { fields: ["id", "name", "list_price"], limit: 1 },
  );
  if (products.length === 0) {
    const templateId: number = await client.call("product.template", "create", [
      { name: "Demo Product A", list_price: 25.0, type: "product" },
    ]);
    const created: any[] = await client.call(
      "product.product",
      "search_read",
      [[["product_tmpl_id", "=", templateId]]],
      { fields: ["id", "name", "list_price"], limit: 1 },
    );
    products.push(...created);
    console.log("product created:", templateId);
  }
  console.log("product:", products[0].id, products[0].name, products[0].list_price);

  // 3. sale.order create + confirm + read back
  const orderId: number = await client.call("sale.order", "create", [
    {
      partner_id: partnerId,
      order_line: [[0, 0, { product_id: products[0].id, product_uom_qty: 2 }]],
    },
  ]);
  console.log("sale.order created:", orderId);
  await client.call("sale.order", "action_confirm", [[orderId]]);
  const back: any[] = await client.call("sale.order", "read", [
    [orderId],
    ["name", "state", "amount_total"],
  ]);
  console.log("sale.order read-back:", JSON.stringify(back[0]));
  console.log("ODOO-PROOF-OK", JSON.stringify({ partnerId, productId: products[0].id, orderId, name: back[0].name, state: back[0].state }));
}

main().catch((e) => {
  console.error("ODOO-PROOF-FAIL", e.message);
  process.exit(1);
});
