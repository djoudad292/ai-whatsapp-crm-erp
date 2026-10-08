import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Order } from "./order.entity";

export type ApprovalRequestStatus = "pending" | "approved" | "rejected" | "expired";
export type ApprovalRequestType = "order_sync" | "order_cancel" | "refund";

/**
 * Approval request raised by the AI workflow when human sign-off is required
 * (e.g. pushing a high-value order to Odoo, cancelling an order, refunding).
 *
 * LOCAL STATE. Tied to a local order by `orderId`. The approval gates the
 * Odoo sync; once approved, the order status transitions and an
 * IntegrationEvent is enqueued.
 */
@Entity({ name: "approval_requests" })
export class ApprovalRequest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  @Index()
  orderId!: string;

  @ManyToOne(() => Order, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order!: Order;

  @Column({
    type: "enum",
    enum: ["order_sync", "order_cancel", "refund"],
  })
  type!: ApprovalRequestType;

  @Column({ type: "text", nullable: true })
  reason!: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  amount!: string | null;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected", "expired"],
    default: "pending",
  })
  @Index()
  status!: ApprovalRequestStatus;

  @Column({ type: "uuid", nullable: true })
  @Index()
  approvedBy!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  approvedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => "now()", onUpdate: "now()" })
  updatedAt!: Date;
}