import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Customer } from "./customer.entity";
import { OrderItem } from "./order-item.entity";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "synced_to_odoo"
  | "fulfilled"
  | "cancelled";

/**
 * Local CRM order — the order workflow's system of record.
 *
 * LOCAL STATE. This entity is NOT the Odoo order; it mirrors it. `odooId`
 * is set once the order has been pushed to Odoo (sale.order). The local order
 * remains authoritative for the conversation-driven workflow (status,
 * approval, cancellation) and is reconciled with Odoo through the
 * IntegrationEvent outbox.
 */
@Entity({ name: "orders" })
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 40, unique: true })
  @Index()
  orderNumber!: string;

  @Column({ type: "uuid" })
  @Index()
  customerId!: string;

  @ManyToOne(() => Customer, (customer) => customer.orders, { onDelete: "CASCADE" })
  @JoinColumn({ name: "customerId" })
  customer!: Customer;

  @Column({
    type: "enum",
    enum: ["pending", "confirmed", "synced_to_odoo", "fulfilled", "cancelled"],
    default: "pending",
  })
  status!: OrderStatus;

  /**
   * Odoo `sale.order` id. Null until the order is pushed to Odoo.
   */
  @Column({ type: "integer", nullable: true })
  @Index()
  odooId!: number | null;

  @Column({ type: "decimal", precision: 12, scale: 2, default: "0" })
  total!: string;

  @Column({ type: "varchar", length: 20, default: "USD" })
  currency!: string;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => "now()", onUpdate: "now()" })
  updatedAt!: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items!: OrderItem[];
}