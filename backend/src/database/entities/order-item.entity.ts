import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Order } from "./order.entity";
import { Product } from "./product.entity";

/**
 * Line item of a local CRM order.
 *
 * LOCAL STATE. `unitPrice` is the price at the time of order placement (a
 * snapshot, not a live reference to Product.price), so historical orders stay
 * correct even if the catalogue price changes later.
 */
@Entity({ name: "order_items" })
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  orderId!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order!: Order;

  @Column({ type: "uuid" })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.items, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "productId" })
  product!: Product;

  @Column({ type: "integer" })
  quantity!: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  lineTotal!: string;

  @CreateDateColumn({ type: "timestamptz", default: () => "now()" })
  createdAt!: Date;
}