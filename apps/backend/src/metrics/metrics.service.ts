import { Inject, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { getDataSourceToken } from "@nestjs/typeorm";
import { Message } from "../database/entities/message.entity";
import { Order } from "../database/entities/order.entity";
import { WebhookEvent } from "../database/entities/webhook-event.entity";
import { ApprovalRequest } from "../database/entities/approval-request.entity";
import { IntegrationEvent } from "../database/entities/integration-event.entity";

export interface MetricsData {
  messagesReceived: number;
  messagesSent: number;
  ordersCreated: number;
  ordersFailed: number;
  refundsRequested: number;
  retries: number;
}

/**
 * Metrics computed from persisted rows — they survive restarts, unlike the
 * old in-memory counters. Definitions:
 * - messagesReceived/Sent: inbound/outbound message rows
 * - ordersCreated: order rows; ordersFailed: webhook_events in failed state
 * - refundsRequested: approval_requests of type refund
 * - retries: sum over integration_events of (attempts - 1), floored at 0
 */
@Injectable()
export class MetricsService {
  constructor(@Inject(getDataSourceToken()) private readonly ds: DataSource) {}

  async getMetrics(): Promise<MetricsData> {
    const messages = await this.ds.getRepository(Message).count({ where: { direction: "inbound" } });
    const sent = await this.ds.getRepository(Message).count({ where: { direction: "outbound" } });
    const orders = await this.ds.getRepository(Order).count();
    const failed = await this.ds.getRepository(WebhookEvent).count({ where: { status: "failed" } });
    const refunds = await this.ds.getRepository(ApprovalRequest).count({ where: { type: "refund" } });
    const events = await this.ds.getRepository(IntegrationEvent).find({ select: ["attempts"] });
    const retries = events.reduce((n, e: any) => n + Math.max(0, (e.attempts ?? 1) - 1), 0);
    return {
      messagesReceived: messages,
      messagesSent: sent,
      ordersCreated: orders,
      ordersFailed: failed,
      refundsRequested: refunds,
      retries,
    };
  }
}
