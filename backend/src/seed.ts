import { DataSource } from "typeorm";
import { ENTITIES } from "./database/database.module";
import { Customer } from "./database/entities/customer.entity";
import { Product } from "./database/entities/product.entity";

async function main() {
  const ds = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/app",
    entities: ENTITIES,
    synchronize: true,
  });
  await ds.initialize();
  const cust = ds.getRepository(Customer);
  const prod = ds.getRepository(Product);

  const customers = [
    { name: "Ahmed", phone: "+213555000001", email: "ahmed@example.com", type: "individual" as const },
    { name: "Sara", phone: "+213555000002", email: "sara@example.com", type: "individual" as const },
    { name: "Company Customer", phone: "+213555000003", email: "orders@acme.example", type: "company" as const },
  ];
  for (const c of customers) {
    const existing = await cust.findOne({ where: { phone: c.phone } });
    if (!existing) await cust.save(cust.create(c));
  }

  const products = [
    { name: "Product A", sku: "A-001", price: "25.00", stockQuantity: 100 },
    { name: "Product B", sku: "B-001", price: "60.00", stockQuantity: 12 },
    { name: "Product C", sku: "C-001", price: "120.00", stockQuantity: 3 },
  ];
  for (const p of products) {
    const existing = await prod.findOne({ where: { sku: p.sku } });
    if (!existing) await prod.save(prod.create({ ...p, isActive: true }));
  }

  console.log("Seeded customers:", await cust.count(), "products:", await prod.count());
  await ds.destroy();
}

main().catch((e) => { console.error(e); process.exit(1); });
