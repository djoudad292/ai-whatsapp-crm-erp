import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export type IntegrationEventStatus = "pending" | "sent" | "failed";
export type IntegrationEventEntity =
  | "customer"
  | "product"
  | "order"
  | "payment";

/**
 * Outbox entry for the transactional-outbox pattern.
 *
 * LOCAL STATE. Writes to Odoo are never direct: a local transaction records an
 * IntegrationEvent row in the same DB transaction as the state change, and a
 * relay process polls the outbox and pushes to Odoo. This guarantees
 * at-least-once delivery with idempotent consumers on the Odoo side.
 *
 * `payload` is the exact JSON the relay will POST to Odoo. `attempts` tracks
 * retries; `lastError` retains the most recent failure for observability.
 */
@Entity({ name: "integration_events" })
export class IntegrationEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 40 })
  @Index()
  entity!: IntegrationEventEntity;

  @Column({ type: "integer", nullable: true })
  @Index()
  odooId!: number | null;

  @Column({ type: "varchar", length: 20 })
  operation!: "create" | "update" | "delete";

  @Column({ type: "jsonb" })
  payload!: Record<string, unknown>;

  @Column({
    type: "enum",
    enum: ["pending", "sent", "failed"],
    default: "pending",
  })
  @Index()
  status!: IntegrationEventStatus;

  @Column({ type: "integer", default: 0 })
  attempts!: number;

  @Column({ type: "text", nullable: true })
  lastError!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  @Index()
  nextAttemptAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => "now()", onUpdate: "now()" })
  updatedAt!: Date;
}