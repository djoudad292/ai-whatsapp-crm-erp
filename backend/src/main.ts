import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  // app.init() runs onModuleInit hooks, including TypeORM's DataSource.initialize().
  // On serverless hosts without a provisioned PostgreSQL, the DB connection will
  // fail. Catch it so the HTTP server still starts and non-database endpoints work.
  try {
    await app.init();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Non-fatal bootstrap error:", (err as Error).message);
  }
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend listening on http://localhost:${port}`);
}

bootstrap();
