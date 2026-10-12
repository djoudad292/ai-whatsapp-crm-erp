import { Module, Type } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { OdooModule } from "./odoo/odoo.module";
import { AuthModule } from "./auth/auth.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { AiModule } from "./ai/ai.module";
import { OrdersModule } from "./orders/orders.module";
import { MetricsModule } from "./metrics/metrics.module";
import { HealthController } from "./health/health.controller";
import { DeliveryModule } from "./delivery/delivery.module";

/**
 * BullMQ needs a long-lived worker process plus a reachable Redis, neither of
 * which exists on serverless hosts. The queue only backs outbound message
 * delivery; inbound webhook handling is synchronous, so the API stays fully
 * functional without it. Opt in with QUEUES_ENABLED=true or by setting
 * REDIS_HOST.
 *
 * The module path is built at runtime so bundlers cannot follow it into
 * BullMQ's optional transports (kafkajs, amqplib, mqtt, nats, grpc), which a
 * serverless bundle would otherwise try to resolve and fail on.
 */
const QUEUES_MODULE_PATH = ["./", "queues/", "queues.module"].join("");

function loadQueuesModule(): Type<unknown>[] {
  if (process.env.QUEUES_ENABLED !== "true" && !process.env.REDIS_HOST) return [];
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(QUEUES_MODULE_PATH);
  return [mod.QueuesModule];
}

const optionalQueues: Type<unknown>[] = loadQueuesModule();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    OdooModule,
    WebhooksModule,
    AiModule,
    ...optionalQueues,
    OrdersModule,
    AuthModule,
    DashboardModule,
    MetricsModule,
    DeliveryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}