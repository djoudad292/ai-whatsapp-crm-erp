import { Body, Controller, Post, HttpStatus, HttpException, Inject } from "@nestjs/common";
import { DataSource } from "typeorm";
import { getDataSourceToken } from "@nestjs/typeorm";
import { WebhookEvent } from "../database/entities/webhook-event.entity";
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
@Controller("webhooks/whatsapp")
export class WebhooksController {
  constructor(@Inject(getDataSourceToken()) private readonly ds: DataSource) {}

  @Post()
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