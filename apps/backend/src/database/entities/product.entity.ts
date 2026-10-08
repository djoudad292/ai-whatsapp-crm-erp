import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from "typeorm";
import { OrderItem } from "./order-item.entity";

/**
 * Product catalogue entry.
 *
 * LOCAL STATE — `stockQuantity` is the local CRM's view of inventory. Odoo's
 * `product.template` quantity lives in Odoo and is mirrored here via
 * IntegrationEvent; the local value is authoritative for the order workflow
 * until the sync confirms otherwise.
 */
@Entity({ name: "products" })
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ type: "varchar", length: 60, unique: true })
  @Index()
  sku!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2, default: "0" })
  price!: string;

  @Column({ type: "integer", default: 0 })
  stockQuantity!: number;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  /**
   * Odoo `product.template` id. Null until pushed to Odoo.
   */
  @Column({ type: "integer", nullable: true, unique: true })
  @Index()
  odooId!: number | null;

  @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => "now()", onUpdate: "now()" })
  updatedAt!: Date;

  @OneToMany(() => OrderItem, (item) => item.product)
  items!: OrderItem[];
}