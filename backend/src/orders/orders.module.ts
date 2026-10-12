import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrderWorkflowService } from "./order-workflow.service";
import { OrdersController } from "./orders.controller";
import { WebhookEvent } from "../database/entities/webhook-event.entity";
import { Customer } from "../database/entities/customer.entity";
import { Message } from "../database/entities/message.entity";
import { Conversation } from "../database/entities/conversation.entity";
import { AuditLog } from "../database/entities/audit-log.entity";
import { IntegrationEvent } from "../database/entities/integration-event.entity";
import { Order } from "../database/entities/order.entity";
import { OrderItem } from "../database/entities/order-item.entity";
import { Product } from "../database/entities/product.entity";
import { AiModule } from "../ai/ai.module";
import { AiOrchestratorService } from "../ai/ai.orchestrator.service";
import { ToolsRegistry } from "../ai/tools.registry";
import { DataSource } from "typeorm";
import { getDataSourceToken } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WebhookEvent,
      Customer,
      Message,
      Conversation,
      AuditLog,
      IntegrationEvent,
      Order,
      OrderItem,
      Product,
    ]),
    AiModule,
  ],
  controllers: [OrdersController],
  providers: [
    {
      provide: OrderWorkflowService,
      useFactory: (ds: DataSource, ai: AiOrchestratorService, tools: ToolsRegistry) =>
        new OrderWorkflowService(ds, ai, tools),
      inject: [getDataSourceToken(), AiOrchestratorService, ToolsRegistry],
    },
  ],
  exports: [OrderWorkflowService],
})
export class OrdersModule {}