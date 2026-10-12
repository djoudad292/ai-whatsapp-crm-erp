import { Module } from "@nestjs/common";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Message } from "../database/entities/message.entity";
import { Order } from "../database/entities/order.entity";
import { WebhookEvent } from "../database/entities/webhook-event.entity";
import { ApprovalRequest } from "../database/entities/approval-request.entity";
import { IntegrationEvent } from "../database/entities/integration-event.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Message, Order, WebhookEvent, ApprovalRequest, IntegrationEvent])],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}