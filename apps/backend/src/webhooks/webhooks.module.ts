import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WebhookEvent } from "../database/entities/webhook-event.entity";
import { Conversation } from "../database/entities/conversation.entity";
import { Message } from "../database/entities/message.entity";
import { WebhooksController } from "./webhooks.controller";

@Module({
  imports: [TypeOrmModule.forFeature([WebhookEvent, Conversation, Message])],
  controllers: [WebhooksController],
})
export class WebhooksModule {}