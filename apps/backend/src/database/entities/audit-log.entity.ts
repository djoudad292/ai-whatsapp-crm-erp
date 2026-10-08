import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "sync"
  | "approve"
  | "reject"
  | "cancel";

export type AuditEntity =
  | "customer"
  | "product"
  | "order"
  | "order_item"
  | "conversation"
  | "message"
  | "approval_request"
  | "integration_event"
  | "webhook_event"
  | "audit_log";

/**
 * Immutable audit trail.
 *
 * LOCAL STATE. Append-only by design: rows are never updated or deleted by
   * application logic. `actor` records who/what performed the action (user id,
   * `system`, or `webhook`); `before`/`after` are JSONB snapshots so any state
   * change is reconstructable without joining other tables.
 */
@Entity({ name: "audit_logs" })
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 20 })
  @Index()
  action!: AuditAction;

  @Column({ type: "varchar", length: 30 })
  @Index()
  entity!: AuditEntity;

  @Column({ type: "varchar", length: 40, nullable: true })
  @Index()
  entityId!: string | null;

  @Column({ type: "varchar", length: 60, nullable: true })
  actor!: string | null;

  @Column({ type: "jsonb", nullable: true })
  before!: Record<string, unknown> | null;

  @Column({ type: "jsonb", nullable: true })
  after!: Record<string, unknown> | null;

  @Column({ type: "varchar", length: 60, nullable: true })
  correlationId!: string | null;

  @Column({ type: "text", nullable: true })
  note!: string | null;

  @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
  createdAt!: Date;
}