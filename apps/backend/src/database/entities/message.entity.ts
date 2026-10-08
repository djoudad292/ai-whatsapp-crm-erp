import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Conversation } from "./conversation.entity";

export type MessageDirection = "inbound" | "outbound";
export type MessageStatus = "received" | "sent" | "delivered" | "read" | "failed";

/**
 * Single message inside a WhatsApp conversation.
 *
 * LOCAL STATE. `externalId` is the WhatsApp message id used for idempotency
 * and deduplication of inbound webhook events.
 */
@Entity({ name: "messages" })
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  conversationId!: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "conversationId" })
  conversation!: Conversation;

  @Column({ type: "enum", enum: ["inbound", "outbound"] })
  direction!: MessageDirection;

  @Column({ type: "varchar", length: 40, unique: true, nullable: true })
  @Index()
  externalId!: string | null;

  @Column({ type: "varchar", length: 20 })
  @Index()
  status!: MessageStatus;

  @Column({ type: "text" })
  body!: string;

  /**
   * Optional structured payload parsed from inbound text (e.g. order intent).
   * Stored as JSONB; null for plain chat messages.
   */
  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
  createdAt!: Date;
}