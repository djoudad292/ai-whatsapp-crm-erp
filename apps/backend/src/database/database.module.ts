import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";

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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
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