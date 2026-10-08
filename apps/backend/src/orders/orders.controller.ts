import { Body, Controller, Get, Param, Post, HttpException, HttpStatus } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { getDataSourceToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { OrderWorkflowService } from "./order-workflow.service";
import { WebhookEvent } from "../database/entities/webhook-event.entity";
import { Product } from "../database/entities/product.entity";

@Controller("api/orders")
export class OrdersController {
  constructor(
    @Inject(OrderWorkflowService) private readonly workflow: OrderWorkflowService,
    @Inject(getDataSourceToken()) private readonly ds: DataSource,
  ) {}

  @Post("demo/run-scenarios")
  async runDemoScenario() {
    const productRepo = this.ds.getRepository(Product);

    const productC = await productRepo.findOne({ where: { sku: "C-001" } });
    if (!productC) {
      throw new HttpException(
        { error: "Product C (C-001) not found in database. Run seed first." },
        HttpStatus.NOT_FOUND,
      );
    }

    const demoPhone = "+213555000001";
    const externalEventId = `demo-${Date.now()}`;

    const webhookRepo = this.ds.getRepository(WebhookEvent);
    const webhookEvent = webhookRepo.create({
      source: "whatsapp",
      externalEventId,
      eventType: "message",
      payload: {
        id: externalEventId,
        timestamp: new Date().toISOString(),
        from: demoPhone,
        to: "business",
        text: `I want 5x Product C`,
        status: "queued",
      },
      status: "received",
    });

    await webhookRepo.save(webhookEvent);

    const result = await this.workflow.processPendingWebhook(webhookEvent.id);

    return {
      scenario: "create order for Product C with quantity 5 -> insufficient inventory path",
      product: {
        name: productC.name,
        sku: productC.sku,
        stockQuantity: productC.stockQuantity,
      },
      request: { phone: demoPhone, text: "I want 5x Product C" },
      result,
    };
  }

  @Post("webhooks/:id/process")
  async processWebhook(@Param("id") id: string) {
    const result = await this.workflow.processPendingWebhook(id);
    return result;
  }

  @Get("webhooks/pending")
  async listPendingWebhooks() {
    const repo = this.ds.getRepository(WebhookEvent);
    const events = await repo.find({
      where: { status: "received" },
      order: { receivedAt: "ASC" },
      take: 50,
    });
    return { pending: events.length, events };
  }
}