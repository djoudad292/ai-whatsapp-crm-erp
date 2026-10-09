import { Body, Controller, Post, HttpStatus, HttpException, Inject } from "@nestjs/common";
import { DataSource } from "typeorm";
import { getDataSourceToken } from "@nestjs/typeorm";
import { WebhookEvent } from "../database/entities/webhook-event.entity";
import { OrderWorkflowService } from "../orders/order-workflow.service";
import { Message } from "../database/entities/message.entity";
import { Conversation } from "../database/entities/conversation.entity";
import {
  WhatsAppWebhookPayload,
  WhatsAppMessageStatus,
  validateWhatsAppPayload,
} from "./webhooks.dto";

/**
 * Inbound WhatsApp webhook endpoint consumed by the mock gateway UI.
 *
 * POST /webhooks/whatsapp
 *
 * Behaviour:
 *  - Validates the JSON payload (400 on invalid).
 *  - Persists a WebhookEvent row, idempotent by `payload.id` (unique on
 *    source + externalEventId). Duplicate deliveries are recorded as
 *    `duplicate` and never re-processed.
 *  - Persists a Message row (inbound) and upserts the Conversation thread,
 *    wiring the Message entity into the webhook pipeline.
 *  - Returns 200 with the persisted ids.
 */
@Controller("webhooks")
export class WebhooksController {
  constructor(
    @Inject(getDataSourceToken()) private readonly ds: DataSource,
    @Inject(OrderWorkflowService) private readonly workflow?: OrderWorkflowService,
  ) {}

  @Post("whatsapp")
  async ingest(@Body() body: unknown) {
    const validation = validateWhatsAppPayload(body);
    if (!validation.valid) {
      throw new HttpException(
        { error: "invalid_payload", errors: validation.errors },
        HttpStatus.BAD_REQUEST,
      );
    }

    const payload = validation.payload;
    const result = await this.ds.transaction(async (manager) => {
      const webhookRepo = manager.getRepository(WebhookEvent);
      const conversationRepo = manager.getRepository(Conversation);
      const messageRepo = manager.getRepository(Message);

      // --- Idempotency: dedup by payload.id (source = whatsapp) ---
      const existing = await webhookRepo.findOne({
        where: { source: "whatsapp", externalEventId: payload.id },
      });
      if (existing) {
        if (existing.status !== "duplicate") {
          existing.status = "duplicate";
          await webhookRepo.save(existing);
        }
        return { deduplicated: true, webhookEventId: existing.id };
      }

      const event = webhookRepo.create({
        source: "whatsapp",
        externalEventId: payload.id,
        eventType: "message",
        payload: payload as unknown as Record<string, unknown>,
        status: "received",
      });

      try {
        await webhookRepo.save(event);
      } catch (err) {
        // Race: a concurrent request inserted the same id first.
        const raced = await webhookRepo.findOne({
          where: { source: "whatsapp", externalEventId: payload.id },
        });
        if (raced) {
          return { deduplicated: true, webhookEventId: raced.id };
        }
        throw err;
      }

      // --- Wire Message entity persistence ---
      const conversationExternalId = `wa:${payload.from}:${payload.to}`;
      let conversation = await conversationRepo.findOne({
        where: { externalId: conversationExternalId },
      });
      if (!conversation) {
        conversation = conversationRepo.create({
          externalId: conversationExternalId,
          channel: "whatsapp",
          status: "open",
          customerId: null,
        });
        await conversationRepo.save(conversation);
      }

      const messageStatus = mapToMessageStatus(payload.status);
      const message = messageRepo.create({
        conversationId: conversation.id,
        direction: "inbound",
        externalId: payload.id,
        status: messageStatus,
        body: payload.text,
        metadata: {
          from: payload.from,
          to: payload.to,
          rawStatus: payload.status,
          timestamp: payload.timestamp,
        },
      });
      await messageRepo.save(message);

      return {
        deduplicated: false,
        webhookEventId: event.id,
        messageId: message.id,
        conversationId: conversation.id,
      };
    });

    return { status: "ok", ...result };
  }

  /**
   * Inbound Telegram webhook (Bot API update object).
   *
   * POST /webhooks/telegram
   *
   * Normalizes the Telegram update into the same internal payload shape as
   * WhatsApp ({id, timestamp, from, to, text, status}) so the order workflow
   * consumes it unchanged. Idempotent by `tg:<chatId>:<messageId>`.
   */
  @Post("telegram")
  async ingestTelegram(@Body() body: any) {
    const msg = body?.message ?? body?.edited_message;
    const text: string | undefined =
      typeof msg?.text === "string" ? msg.text : undefined;
    if (!msg || !text || msg?.chat?.id === undefined || msg?.message_id === undefined) {
      throw new HttpException(
        { error: "invalid_payload", message: "expected Telegram message update with text" },
        HttpStatus.BAD_REQUEST,
      );
    }
    const chatId = String(msg.chat.id);
    const sender = msg.from ?? {};
    const senderName = [sender.first_name, sender.last_name].filter(Boolean).join(" ") || `tg-user-${sender.id ?? chatId}`;
    const externalId = `tg:${chatId}:${msg.message_id}`;
    const payload = {
      id: externalId,
      timestamp: new Date((msg.date ?? Date.now() / 1000) * 1000).toISOString(),
      from: `tg:${sender.id ?? chatId}`,
      to: "telegram-bot",
      text,
      status: "delivered",
      senderName,
    };

    const result = await this.ds.transaction(async (manager) => {
      const webhookRepo = manager.getRepository(WebhookEvent);
      const conversationRepo = manager.getRepository(Conversation);
      const messageRepo = manager.getRepository(Message);

      const existing = await webhookRepo.findOne({
        where: { source: "telegram", externalEventId: externalId },
      });
      if (existing) {
        if (existing.status !== "duplicate") {
          existing.status = "duplicate";
          await webhookRepo.save(existing);
        }
        return { deduplicated: true, webhookEventId: existing.id };
      }

      const event = webhookRepo.create({
        source: "telegram",
        externalEventId: externalId,
        eventType: "message",
        payload: payload as unknown as Record<string, unknown>,
        status: "received",
      });
      try {
        await webhookRepo.save(event);
      } catch (err) {
        const raced = await webhookRepo.findOne({
          where: { source: "telegram", externalEventId: externalId },
        });
        if (raced) return { deduplicated: true, webhookEventId: raced.id };
        throw err;
      }

      const conversationExternalId = `tg:${chatId}`;
      let conversation = await conversationRepo.findOne({
        where: { externalId: conversationExternalId },
      });
      if (!conversation) {
        conversation = conversationRepo.create({
          externalId: conversationExternalId,
          channel: "telegram",
          status: "open",
          customerId: null,
        });
        await conversationRepo.save(conversation);
      }

      const message = messageRepo.create({
        conversationId: conversation.id,
        direction: "inbound",
        externalId,
        status: "delivered",
        body: text,
        metadata: { chatId, senderName, timestamp: payload.timestamp },
      });
      await messageRepo.save(message);

      return {
        deduplicated: false,
        webhookEventId: event.id,
        messageId: message.id,
        conversationId: conversation.id,
      };
    });

    // Live channel: process immediately so the customer gets a reply.
    // Never fail the webhook acknowledgement because of workflow errors.
    if (!result.deduplicated && this.workflow) {
      try {
        await this.workflow.processPendingWebhook(result.webhookEventId);
      } catch (e: any) {
        console.warn(`[webhooks] telegram auto-process failed: ${e.message}`);
      }
    }

    return { status: "ok", ...result };
  }
}

function mapToMessageStatus(status: WhatsAppMessageStatus): Message["status"] {
  switch (status) {
    case "delivered":
      return "delivered";
    case "failed":
      return "failed";
    case "queued":
    default:
      return "received";
  }
}