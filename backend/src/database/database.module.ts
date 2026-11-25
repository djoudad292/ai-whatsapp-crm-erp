import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { getDataSourceToken } from "@nestjs/typeorm";

import { Customer } from "./entities/customer.entity";
import { Product } from "./entities/product.entity";
import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Conversation } from "./entities/conversation.entity";
import { Message } from "./entities/message.entity";
import { IntegrationEvent } from "./entities/integration-event.entity";
import { WebhookEvent } from "./entities/webhook-event.entity";
import { ApprovalRequest } from "./entities/approval-request.entity";
import { AuditLog } from "./entities/audit-log.entity";

export const ENTITIES = [
  Customer,
  Product,
  Order,
  OrderItem,
  Conversation,
  Message,
  IntegrationEvent,
  WebhookEvent,
  ApprovalRequest,
  AuditLog,
];

const entities = ENTITIES;

function databaseConfig(configService: ConfigService) {
  return {
    type: "postgres" as const,
    url: configService.get<string>("DATABASE_URL"),
    entities: ENTITIES,
    synchronize: configService.get<string>("DB_SYNCHRONIZE") !== "false" && configService.get<string>("NODE_ENV") !== "production",
    migrations: [__dirname + "/migrations/*.js"],
    migrationsRun: false,
    logging: configService.get<string>("NODE_ENV") !== "production",
    ssl:
      configService.get<string>("DATABASE_SSL") === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  };
}

@Module({
  imports: [
    ConfigModule,
    // forRootAsync is intentionally NOT used: it auto-calls DataSource.initialize()
    // and crashes the NestJS bootstrap when the database is unreachable (e.g. on
    // serverless hosts without a provisioned PostgreSQL). Instead we create the
    // DataSource manually below and attempt initialization with a try/catch so
    // the API stays functional even when the database is temporarily unavailable.
    TypeOrmModule.forFeature(entities),
  ],
  providers: [
    {
      provide: getDataSourceToken(),
      useFactory: (configService: ConfigService) => new DataSource(databaseConfig(configService)),
      inject: [ConfigService],
    },
    {
      provide: "DATA_SOURCE_INIT",
      useFactory: async (ds: DataSource) => {
        try {
          await ds.initialize();
        } catch (err) {
          // Non-fatal: the API remains usable for non-database endpoints.
          // eslint-disable-next-line no-console
          console.error("Database connection failed (non-fatal):", (err as Error).message);
        }
      },
      inject: [getDataSourceToken()],
    },
  ],
  exports: [getDataSourceToken(), TypeOrmModule],
})
export class DatabaseModule {}

// Re-export for the migration CLI: `ts-node` needs a DataSource built from the
// same config so `npx typeorm migration:run` and `npx typeorm migration:revert`
// share the app's connection settings.
export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false,
  migrations: [__dirname + "/migrations/*.js"],
  entities,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});