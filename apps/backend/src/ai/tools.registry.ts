/**
 * Controlled tool registry. The LLM never sees raw DB access — only these.
 */
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { getDataSourceToken } from "@nestjs/typeorm";
import { Inject } from "@nestjs/common";
import { Customer } from "../database/entities/customer.entity";
import { Product } from "../database/entities/product.entity";
import { Order } from "../database/entities/order.entity";
import { OrderItem } from "../database/entities/order-item.entity";
import { Message } from "../database/entities/message.entity";
import { AuditLog } from "../database/entities/audit-log.entity";
import { OrderStatus } from "../database/entities/order.entity";

export interface ToolContext {
  phone: string;
  correlationId: string;
}

@Injectable()
export class ToolsRegistry {
  constructor(@Inject(getDataSourceToken()) private readonly ds: DataSource) {}

  private async audit(ctx: ToolContext, actionLabel: string, target: string, success: boolean, input: unknown, result: unknown) {
    const lower = actionLabel.toLowerCase();
    const action: any = lower.includes("create") || lower.includes("order") ? "create" : lower.includes("update") || lower.includes("check") ? "update" : "sync";
    const entity: any = lower.includes("product") ? "product" : lower.includes("inventory") ? "product" : lower.includes("order") ? "order" : lower.includes("message") ? "message" : lower.includes("customer") ? "customer" : "integration_event";
    await this.ds.getRepository(AuditLog).save(
      this.ds.getRepository(AuditLog).create({
        action,
        entity,
        entityId: target ?? null,
        actor: "ai",
        before: null,
        after: { label: actionLabel, success, inputSummary: JSON.stringify(input)?.slice(0, 300), result } as any,
        correlationId: ctx.correlationId,
        note: null,
      } as any),
    );
  }

  async getCustomer(ctx: ToolContext) {
    const repo = this.ds.getRepository(Customer);
    const c = await repo.findOne({ where: { phone: ctx.phone } });
    await this.audit(ctx, "GET_CUSTOMER", ctx.phone, !!c, undefined, c ? "found" : "not found");
    return c;
  }

  async searchProducts(ctx: ToolContext, query: string) {
    const repo = this.ds.getRepository(Product);
    const out = await repo
      .createQueryBuilder("p")
      .where("p.name ILIKE :q", { q: `%${query}%` })
      .orWhere("p.sku = :sku", { sku: query })
      .andWhere("p.isActive = true")
      .getMany();
    await this.audit(ctx, "SEARCH_PRODUCTS", query, true, { query }, `${out.length} results`);
    return out;
  }

  async checkInventory(ctx: ToolContext, productId: string) {
    const p = await this.ds.getRepository(Product).findOne({ where: { id: productId } });
    await this.audit(ctx, "CHECK_INVENTORY", productId, !!p, undefined, p ? p.stockQuantity : "missing");
    return p;
  }

  async createOrder(ctx: ToolContext, items: { productId: string; quantity: number }[]) {
    if (!items.length || items.some((i) => i.quantity <= 0)) {
      await this.audit(ctx, "CREATE_ORDER", ctx.phone, false, items, "invalid quantity");
      throw new Error("Invalid order items: quantity must be > 0");
    }
    const qr = this.ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const prodRepo = qr.manager.getRepository(Product);
      for (const i of items) {
        const p = await prodRepo.findOne({ where: { id: i.productId } });
        if (!p || p.stockQuantity < i.quantity) throw new Error(`Insufficient inventory for ${p?.name ?? i.productId}`);
        p.stockQuantity -= i.quantity;
        await prodRepo.save(p);
      }
      const customer = await qr.manager.getRepository(Customer).findOne({ where: { phone: ctx.phone } });
      let totalSum = 0;
      for (const i of items) {
        const pp = await qr.manager.getRepository(Product).findOne({ where: { id: i.productId } });
        totalSum += Number(pp!.price) * i.quantity;
      }
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      const order = await qr.manager.getRepository(Order).save(
        qr.manager.getRepository(Order).create({
          customerId: customer!.id,
          status: "pending" as any,
          orderNumber,
          total: totalSum.toFixed(2),
        } as any),
      );
      const createdOrder = Array.isArray(order) ? order[0] : order;
      for (const i of items) {
        const p = await qr.manager.getRepository(Product).findOne({ where: { id: i.productId } });
        await qr.manager.getRepository(OrderItem).save(
          qr.manager.getRepository(OrderItem).create({ orderId: createdOrder.id, productId: p!.id, quantity: i.quantity, unitPrice: p!.price, lineTotal: (Number(p!.price) * i.quantity).toFixed(2) } as any),
        );
      }
      await qr.commitTransaction();
      await this.audit(ctx, "ORDER_CREATED", createdOrder.id, true, items, "ok");
      return createdOrder;
    } catch (e: any) {
      await qr.rollbackTransaction();
      await this.audit(ctx, "ORDER_CREATION_FAILED", ctx.phone, false, items, e.message);
      throw e;
    } finally {
      await qr.release();
    }
  }

  async sendCustomerMessage(ctx: ToolContext, conversationId: string, text: string) {
    const repo = this.ds.getRepository(Message);
    const msg = await repo.save(
      repo.create({ conversationId, direction: "outbound" as any, body: text, status: "queued" } as any),
    );
    await this.audit(ctx, "MESSAGE_SENT", conversationId, true, undefined, "queued");
    return msg;
  }
}
