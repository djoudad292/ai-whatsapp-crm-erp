import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from "typeorm";
import { Order } from "./order.entity";

export type CustomerType = "individual" | "company";

/**
 * Local CRM representation of a customer/contact.
 *
 * LOCAL STATE — this is the system of record for CRM data. It is intentionally
 * separate from Odoo's `res.partner`: `odooId` mirrors the Odoo partner id so
 * the two can be reconciled, but the CRM owns name/phone/email and Odoo is
 * treated as a downstream projection (see IntegrationEvent outbox).
 */
@Entity({ name: "customers" })
export class Customer {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  name!: string;

  @Column({ type: "varchar", length: 30, unique: true })
  @Index()
  phone!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null;

  @Column({ type: "enum", enum: ["individual", "company"] })
  type!: CustomerType;

  /**
   * Odoo `res.partner` id. Null until the customer has been pushed to Odoo.
   * This is the reconciliation key between local CRM state and Odoo state.
   */
  @Column({ type: "integer", nullable: true, unique: true })
  @Index()
  odooId!: number | null;

  @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => "now()", onUpdate: "now()" })
  updatedAt!: Date;

  @OneToMany(() => Order, (order) => order.customer)
  orders!: Order[];
}