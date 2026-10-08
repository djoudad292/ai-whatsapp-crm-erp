import { Injectable } from "@nestjs/common";

export interface MetricsData {
  messagesReceived: number;
  messagesSent: number;
  ordersCreated: number;
  ordersFailed: number;
  refundsRequested: number;
  retries: number;
}

@Injectable()
export class MetricsService {
  private readonly counters: MetricsData = {
    messagesReceived: 0,
    messagesSent: 0,
    ordersCreated: 0,
    ordersFailed: 0,
    refundsRequested: 0,
    retries: 0,
  };

  getMetrics(): MetricsData {
    return { ...this.counters };
  }

  incrementMessagesReceived(): void {
    this.counters.messagesReceived++;
  }

  incrementMessagesSent(): void {
    this.counters.messagesSent++;
  }

  incrementOrdersCreated(): void {
    this.counters.ordersCreated++;
  }

  incrementOrdersFailed(): void {
    this.counters.ordersFailed++;
  }

  incrementRefundsRequested(): void {
    this.counters.refundsRequested++;
  }

  incrementRetries(): void {
    this.counters.retries++;
  }

  reset(): void {
    (Object.keys(this.counters) as (keyof MetricsData)[]).forEach((key) => {
      this.counters[key] = 0;
    });
  }
}