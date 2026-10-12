import "reflect-metadata";
import { DataSource } from "typeorm";
import { ENTITIES } from "../src/database/database.module";
async function main() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5433/crm", entities: ENTITIES, synchronize: false });
  await ds.initialize();
  console.log("metadata names:", ds.entityMetadatas.map((m) => m.name).join(","));
  await ds.destroy();
}
main().catch((e) => console.log("ERR", e.message));
