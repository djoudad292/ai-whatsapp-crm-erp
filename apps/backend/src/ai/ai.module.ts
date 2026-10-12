import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AiOrchestratorService } from "./ai.orchestrator.service";
import { ToolsRegistry } from "./tools.registry";
import { AuditLog } from "../database/entities/audit-log.entity";
import { Conversation } from "../database/entities/conversation.entity";
import { Customer } from "../database/entities/customer.entity";
import { Message } from "../database/entities/message.entity";
import { Order } from "../database/entities/order.entity";
import { OrderItem } from "../database/entities/order-item.entity";
import { Product } from "../database/entities/product.entity";
import { IntegrationEvent } from "../database/entities/integration-event.entity";
import { WebhookEvent } from "../database/entities/webhook-event.entity";
import { ApprovalRequest } from "../database/entities/approval-request.entity";
import { DeliveryModule } from "../delivery/delivery.module";

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, Conversation, Customer, Message, Order, OrderItem, Product, IntegrationEvent, WebhookEvent, ApprovalRequest]), DeliveryModule],
  providers: [AiOrchestratorService, ToolsRegistry],
  exports: [AiOrchestratorService, ToolsRegistry],
})
export class AiModule {}
