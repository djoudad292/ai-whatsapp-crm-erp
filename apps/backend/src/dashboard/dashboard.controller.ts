import { Body, Controller, Get, HttpException, HttpStatus, Inject, Param, Post, Query } from "@nestjs/common";
import { DataSource } from "typeorm";
import { getDataSourceToken } from "@nestjs/typeorm";
import { Order } from "../database/entities/order.entity";
import { Conversation } from "../database/entities/conversation.entity";
import { Message } from "../database/entities/message.entity";
import { Customer } from "../database/entities/customer.entity";
import { Product } from "../database/entities/product.entity";
import { AuditLog } from "../database/entities/audit-log.entity";
import { ApprovalRequest } from "../database/entities/approval-request.entity";

/**
 * Read-only dashboard API + approval actions.
 *
 * Demo-grade: no auth gate (the dashboard login is presentational; the HMAC
 * AuthGuard from Phase 9 can be layered on these routes later). All reads
 * are capped and ordered newest-first.
 */
@Controller("api")
export class DashboardController {
  constructor(@Inject(getDataSourceToken()) private readonly ds: DataSource) {}

  @Get("orders")
  async orders(@Query("take") take = "25") {
    const rows = await this.ds.getRepository(Order).find({
      order: { createdAt: "DESC" },
      take: Math.min(Number(take) || 25, 100),
      relations: { customer: true },
    });
    return rows.map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      customer: o.customer ? { id: o.customer.id, name: o.customer.name, phone: o.customer.phone } : null,
      odooId: o.odooId ?? null,
      createdAt: o.createdAt,
    }));
  }

  @Get("conversations")
  async conversations(@Query("take") take = "25") {
    const convs = await this.ds.getRepository(Conversation).find({
      order: { createdAt: "DESC" },
      take: Math.min(Number(take) || 25, 100),
    });
    const msgRepo = this.ds.getRepository(Message);
    return Promise.all(
      convs.map(async (c: any) => ({
        id: c.id,
        externalId: c.externalId,
        channel: c.channel,
        status: c.status,
        messageCount: await msgRepo.count({ where: { conversationId: c.id } }),
        lastMessage: (
          await msgRepo.find({ where: { conversationId: c.id }, order: { createdAt: "DESC" }, take: 1 })
        )[0] ?? null,
        createdAt: c.createdAt,
      })),
    );
  }

  @Get("conversations/:id/messages")
  async messages(@Param("id") id: string) {
    return this.ds.getRepository(Message).find({
      where: { conversationId: id },
      order: { createdAt: "ASC" },
      take: 200,
    });
  }

  @Get("customers")
  async customers(@Query("take") take = "50") {
    return this.ds.getRepository(Customer).find({
      order: { createdAt: "DESC" },
      take: Math.min(Number(take) || 50, 200),
    });
  }

  @Get("products")
  async products() {
    return this.ds.getRepository(Product).find({ order: { name: "ASC" } });
  }

  @Get("audit")
  async audit(@Query("take") take = "50") {
    const rows = await this.ds.getRepository(AuditLog).find({
      order: { createdAt: "DESC" },
      take: Math.min(Number(take) || 50, 200),
    });
    return rows;
  }

  @Get("approvals")
  async approvals(@Query("status") status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.ds.getRepository(ApprovalRequest).find({
      where,
      order: { createdAt: "DESC" },
      take: 100,
    });
  }

  @Post("approvals/:id/approve")
  async approve(@Param("id") id: string, @Body() body: any = {}) {
    return this.decide(id, "approved", body?.decidedBy ?? "dashboard");
  }

  @Post("approvals/:id/reject")
  async reject(@Param("id") id: string, @Body() body: any = {}) {
    return this.decide(id, "rejected", body?.decidedBy ?? "dashboard");
  }

  private async decide(id: string, status: "approved" | "rejected", decidedBy: string) {
    const repo = this.ds.getRepository(ApprovalRequest);
    const row: any = await repo.findOne({ where: { id } });
    if (!row) throw new HttpException({ error: "not_found" }, HttpStatus.NOT_FOUND);
    if (row.status !== "pending") {
      throw new HttpException({ error: "already_decided", status: row.status }, HttpStatus.CONFLICT);
    }
    row.status = status;
    row.approvedBy = decidedBy;
    row.approvedAt = new Date();
    await repo.save(row);
    await this.ds.getRepository(AuditLog).save(
      this.ds.getRepository(AuditLog).create({
        action: status === "approved" ? "approve" : "reject",
        entity: "approval_request",
        entityId: id,
        actor: decidedBy,
        before: null,
        after: { status } as any,
        correlationId: null,
        note: null,
      } as any),
    );
    return row;
  }
}
