import { Module, Type } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { OdooModule } from "./odoo/odoo.module";
import { AuthModule } from "./auth/auth.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { QueuesModule } from "./queues/queues.module";
import { AiModule } from "./ai/ai.module";
import { OrdersModule } from "./orders/orders.module";
import { MetricsModule } from "./metrics/metrics.module";
import { HealthController } from "./health/health.controller";

/**
 * BullMQ needs a long-lived worker process plus a reachable Redis, neither of
 * which exists on serverless hosts (Vercel). The queue only backs outbound
 * message delivery; inbound webhook handling is synchronous, so the API stays
 * fully functional without it. Opt in with QUEUES_ENABLED=true or by setting
 * REDIS_HOST, and the queue is registered exactly as before.
 */
const queuesEnabled = process.env.QUEUES_ENABLED === "true" || Boolean(process.env.REDIS_HOST);
const optionalQueues: Type<unknown>[] = queuesEnabled ? [QueuesModule] : [];

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
  ],
  controllers: [HealthController],
})
export class AppModule {}