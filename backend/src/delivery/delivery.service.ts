import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { Message } from "../database/entities/message.entity";
import { Conversation } from "../database/entities/conversation.entity";
import { WhatsAppClient, SendResult, whatsappConfigFromEnv } from "../whatsapp/whatsapp.client";

/** Give up on a message after this many attempts and mark it failed for good. */
const MAX_ATTEMPTS = 6;

export interface DrainReport {
  scanned: number;
  sent: number;
  failed: number;
  permanent: number;
}

/**
 * Outbound delivery that works on a serverless host.
 *
 * A request cannot assume a background worker exists, so each message is
 * attempted inline while the request is still alive. Failures leave the row in
 * 'queued' with a scheduled nextAttemptAt, and drain() is the retry pass that a
 * cron trigger or an operator calls later. Both paths share this one code so
 * retry semantics cannot drift between them.
 */
@Injectable()
export class DeliveryService {
  private readonly log = new Logger(DeliveryService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  private client(): WhatsAppClient | null {
    const cfg = whatsappConfigFromEnv();
    return cfg ? new WhatsAppClient(cfg) : null;
  }

  /** Extract the customer phone from a WhatsApp conversation key (`wa:<from>:<to>`). */
  private customerPhone(conversation: Conversation): string | null {
    if (conversation.channel !== "whatsapp") return null;
    const parts = (conversation.externalId ?? "").split(":");
    return parts.length >= 2 && parts[0] === "wa" ? parts[1] : null;
  }

  /** Attempt one delivery, persisting success or a scheduled retry. */
  async attempt(messageId: string): Promise<SendResult | null> {
    const repo = this.ds.getRepository(Message);
    const message = await repo.findOne({ where: { id: messageId } });
    if (!message || message.direction !== "outbound") return null;
    if (message.status === "sent" || message.status === "failed") return null;

    const conversation = await this.ds.getRepository(Conversation).findOne({
      where: { id: message.conversationId },
    });
    if (!conversation) return null;

    const phone = this.customerPhone(conversation);
    if (!phone) {
      // Nothing to send to — a terminal state, not something to retry.
      message.status = "failed";
      message.deliveryError = "no customer phone on conversation";
      await repo.save(message);
      return { ok: false, error: "no customer phone", retryable: false };
    }

    const client = this.client();
    if (!client) {
      // Unconfigured: keep the row queued so nothing is lost once credentials land.
      message.status = "queued";
      message.deliveryError = "WhatsApp credentials not configured";
      message.nextAttemptAt = new Date(Date.now() + 5 * 60_000);
      await repo.save(message);
      return { ok: false, error: "credentials not configured", retryable: true };
    }

    const result = await client.sendText(phone, message.body);
    message.deliveryAttempts = (message.deliveryAttempts ?? 0) + 1;

    if (result.ok) {
      message.status = "sent";
      message.externalId = result.messageId ?? null;
      message.deliveryError = null;
      message.nextAttemptAt = null;
      await repo.save(message);
      this.log.log(`sent ${message.id} -> ${phone} (wamid=${result.messageId})`);
    } else if (!result.retryable || message.deliveryAttempts >= MAX_ATTEMPTS) {
      message.status = "failed";
      message.deliveryError = result.error ?? "unknown error";
      message.nextAttemptAt = null;
      await repo.save(message);
      this.log.warn(`giving up on ${message.id}: ${result.error}`);
    } else {
      // Exponential backoff capped at ~30 minutes.
      const delay = Math.min(2 ** message.deliveryAttempts * 30_000, 1_800_000);
      message.status = "queued";
      message.deliveryError = result.error ?? "unknown error";
      message.nextAttemptAt = new Date(Date.now() + delay);
      await repo.save(message);
      this.log.warn(`retry ${message.deliveryAttempts} for ${message.id} in ${Math.round(delay / 1000)}s: ${result.error}`);
    }
    return result;
  }

  /**
   * Retry pass over queued messages whose backoff has elapsed. Safe to call from
   * a scheduled function, an operator endpoint, or by hand.
   */
  async drain(limit = 20): Promise<DrainReport> {
    const repo = this.ds.getRepository(Message);
    const pending = await repo
      .createQueryBuilder("m")
      .where("m.direction = :direction", { direction: "outbound" })
      .andWhere("m.status = :status", { status: "queued" })
      .andWhere("(m.nextAttemptAt IS NULL OR m.nextAttemptAt <= now())")
      .orderBy("m.createdAt", "ASC")
      .limit(limit)
      .getMany();

    const report: DrainReport = { scanned: pending.length, sent: 0, failed: 0, permanent: 0 };
    for (const message of pending) {
      const result = await this.attempt(message.id);
      if (result?.ok) report.sent += 1;
      else if (result && result.retryable === false) report.permanent += 1;
      else if (result) report.failed += 1;
    }
    return report;
  }
}