import "reflect-metadata";
import { AppDataSource } from "./database.module";

const action = process.argv[2] ?? "run";

AppDataSource.initialize()
  .then(async (ds) => {
    if (action === "revert") {
      await ds.undoLastMigration();
    } else {
      await ds.runMigrations();
    }
    console.log(`Migrations ${action} complete`);
    await ds.destroy();
    process.exit(0);
  })
  .catch((err) => {
    console.error(`Migration ${action} failed:`, err);
    process.exit(1);
  });