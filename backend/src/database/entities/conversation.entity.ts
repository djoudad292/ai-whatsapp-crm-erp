import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Customer } from "./customer.entity";
import { Message } from "./message.entity";

export type ConversationStatus = "open" | "closed" | "archived";
export type ConversationChannel = "whatsapp" | "telegram";

/**
 * WhatsApp conversation thread, owned by the CRM.
 *
 * LOCAL STATE. The conversation lives entirely in the CRM; WhatsApp is a
 * transport (behind the gateway adapter), not a system of record. The thread
 * is keyed by `externalId` (the WhatsApp conversation id) so it can be
 * reconciled with incoming webhook events.
 */
@Entity({ name: "conversations" })
export class Conversation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 60, unique: true })
  @Index()
  externalId!: string;

  @Column({ type: "enum", enum: ["whatsapp"] })
  channel!: ConversationChannel;

  @Column({ type: "uuid", nullable: true })
  @Index()
  customerId!: string | null;

  @ManyToOne(() => Customer, (customer) => customer.orders, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "customerId" })
  customer!: Customer | null;

  @Column({
    type: "enum",
    enum: ["open", "closed", "archived"],
    default: "open",
  })
  status!: ConversationStatus;

  @Column({ type: "varchar", length: 200, nullable: true })
  summary!: string | null;

  @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => "now()", onUpdate: "now()" })
  updatedAt!: Date;

@OneToMany(() => Message, (message) => message.conversation, {
    cascade: true,
    eager: true,
  })
  messages!: Message[];
}