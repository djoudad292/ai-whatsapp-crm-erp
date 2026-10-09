import { Module } from "@nestjs/common";
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    OdooModule,
    WebhooksModule,
    AiModule,
    QueuesModule,
    OrdersModule,
    AuthModule,
    DashboardModule,
    MetricsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}