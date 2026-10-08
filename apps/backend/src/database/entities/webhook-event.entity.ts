import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

export type WebhookEventSource = "odoo" | "whatsapp";
export type WebhookEventStatus = "received" | "processed" | "failed" | "duplicate";

/**
 * Inbound webhook event record.
 *
 * LOCAL STATE. Every webhook (WhatsApp inbound message, Odoo outbound event)
   * is recorded here before processing so the pipeline is idempotent and
   * replayable. `externalEventId` is the deduplication key; a duplicate
   * delivery is stored as `duplicate` and ignored by the consumer.
 */
@Entity({ name: "webhook_events" })
export class WebhookEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "enum", enum: ["odoo", "whatsapp"] })
  @Index()
  source!: WebhookEventSource;

  @Column({ type: "varchar", length: 120 })
  @Index()
  externalEventId!: string;

  @Column({ type: "varchar", length: 80, nullable: true })
  @Index()
  eventType!: string | null;

  @Column({ type: "jsonb" })
  payload!: Record<string, unknown>;

  @Column({
    type: "enum",
    enum: ["received", "processed", "failed", "duplicate"],
    default: "received",
  })
  @Index()
  status!: WebhookEventStatus;

  @Column({ type: "text", nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
  receivedAt!: Date;
}