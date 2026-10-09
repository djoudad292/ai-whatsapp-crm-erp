import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DashboardController } from "./dashboard.controller";
import { Order } from "../database/entities/order.entity";
import { Conversation } from "../database/entities/conversation.entity";
import { Message } from "../database/entities/message.entity";
import { Customer } from "../database/entities/customer.entity";
import { Product } from "../database/entities/product.entity";
import { AuditLog } from "../database/entities/audit-log.entity";
import { ApprovalRequest } from "../database/entities/approval-request.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Order, Conversation, Message, Customer, Product, AuditLog, ApprovalRequest])],
  controllers: [DashboardController],
})
export class DashboardModule {}
