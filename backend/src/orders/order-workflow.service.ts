import { Injectable, Logger } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { getDataSourceToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { WebhookEvent } from "../database/entities/webhook-event.entity";
import { Customer } from "../database/entities/customer.entity";
import { Message } from "../database/entities/message.entity";
import { Conversation } from "../database/entities/conversation.entity";
import { AuditLog } from "../database/entities/audit-log.entity";
import { IntegrationEvent } from "../database/entities/integration-event.entity";
import { AiOrchestratorService, AiIntent } from "../ai/ai.orchestrator.service";
import { ToolsRegistry, ToolContext } from "../ai/tools.registry";

export interface OrderWorkflowResult {
  success: boolean;
  orderId?: string;
  error?: string;
  intent?: AiIntent;
  items?: { productId: string; quantity: number }[];
}

@Injectable()
export class OrderWorkflowService {
  private readonly logger = new Logger(OrderWorkflowService.name);

  constructor(
    @Inject(getDataSourceToken()) private readonly ds: DataSource,
    private readonly ai: AiOrchestratorService,
    private readonly tools: ToolsRegistry,
  ) {}

  async processPendingWebhook(webhookId: string): Promise<OrderWorkflowResult> {
    const webhookEvent = await this.ds.getRepository(WebhookEvent).findOne({
      where: { id: webhookId, status: "received" },
    });

    if (!webhookEvent) {
      return { success: false, error: "WebhookEvent not found or not pending" };
    }

    const correlationId = webhookEvent.id;
    const phone = (webhookEvent.payload.from as string) ?? "";
    const text = (webhookEvent.payload.text as string) ?? "";

    if (!phone || !text) {
      await this.markWebhookFailed(webhookEvent, "Missing phone or text in payload");
      return { success: false, error: "Missing phone or text in payload" };
    }

    const ctx: ToolContext = { phone, correlationId };

    try {
      let aiOutput;
      try {
        aiOutput = await this.ai.orchestrateSmart(text);
      } catch (e: any) {
        this.logger.warn(`AI orchestration failed: ${e.message}`);
        await this.sendFallbackMessage(ctx, "I couldn't understand your request. Please try again with a clearer message.");
        await this.markWebhookProcessed(webhookEvent);
        return { success: false, error: "AI orchestration failed" };
      }

      const { intent, items, confidence } = aiOutput;

      await this.persistInboundMessage(webhookEvent, phone, text, aiOutput);

      if (intent === "order" && items.length > 0) {
        const result = await this.processOrderIntent(ctx, phone, items, correlationId);
        await this.markWebhookProcessed(webhookEvent);
        return result;
      } else if (intent === "inquiry" && items.length > 0) {
        await this.processInquiryIntent(ctx, phone, items, correlationId);
        await this.markWebhookProcessed(webhookEvent);
        return { success: true, intent, items: [] };
      } else {
        await this.sendFallbackMessage(ctx, "I can help you place orders or check product availability. Try saying something like 'I want 2x Product A' or 'What's the stock for Product B?'");
        await this.markWebhookProcessed(webhookEvent);
        return { success: true, intent, items: [] };
      }
    } catch (e: any) {
      this.logger.error(`Order workflow failed for webhook ${webhookId}: ${e.message}`, e.stack);
      await this.markWebhookFailed(webhookEvent, e.message);
      return { success: false, error: e.message };
    }
  }

  private async processOrderIntent(
    ctx: ToolContext,
    phone: string,
    items: { name?: string; sku?: string; quantity: number }[],
    correlationId: string,
  ): Promise<OrderWorkflowResult> {
    const customer = await this.upsertCustomerByPhone(phone);
    if (!customer) {
      await this.sendFallbackMessage(ctx, "Unable to identify your account. Please contact support.");
      return { success: false, error: "Customer upsert failed" };
    }

    const conversation = await this.getOrCreateConversation(phone);
    const orderItems: { productId: string; quantity: number }[] = [];

    for (const item of items) {
      const searchQuery = item.sku ?? item.name ?? "";
      if (!searchQuery) continue;

      const products = await this.tools.searchProducts(ctx, searchQuery);
      if (products.length === 0) {
        await this.sendFallbackMessage(ctx, `Product "${searchQuery}" not found.`);
        return { success: false, error: `Product not found: ${searchQuery}` };
      }

      const product = products[0];
      const inventory = await this.tools.checkInventory(ctx, product.id);
      if (!inventory) {
        await this.sendFallbackMessage(ctx, `Product "${product.name}" is no longer available.`);
        return { success: false, error: `Product missing: ${product.id}` };
      }

      if (inventory.stockQuantity < item.quantity) {
        const msg = `Insufficient inventory for ${product.name}. Requested: ${item.quantity}, Available: ${inventory.stockQuantity}.`;
        await this.sendOutboundMessage(ctx, conversation.id, msg);
        await this.auditOrder(ctx, "create", "order", product.id, false, { requested: item.quantity, available: inventory.stockQuantity });
        return { success: false, error: msg, items: orderItems };
      }

      orderItems.push({ productId: product.id, quantity: item.quantity });
    }

    if (orderItems.length === 0) {
      await this.sendFallbackMessage(ctx, "No valid products found in your request.");
      return { success: false, error: "No valid products" };
    }

    try {
      const order = await this.tools.createOrder(ctx, orderItems);
      await this.sendOutboundMessage(
        ctx,
        conversation.id,
        `Order ${order.orderNumber} created successfully with ${orderItems.length} item(s). Total: ${order.total} ${order.currency}.`,
      );
      await this.auditOrder(ctx, "create", "order", order.id, true, orderItems);
      return { success: true, orderId: order.id, intent: "order", items: orderItems };
    } catch (e: any) {
      await this.sendOutboundMessage(ctx, conversation.id, `Order failed: ${e.message}`);
      await this.auditOrder(ctx, "create", "order", ctx.phone, false, orderItems, e.message);
      return { success: false, error: e.message, items: orderItems };
    }
  }

  private async processInquiryIntent(
    ctx: ToolContext,
    phone: string,
    items: { name?: string; sku?: string; quantity: number }[],
    correlationId: string,
  ): Promise<void> {
    const conversation = await this.getOrCreateConversation(phone);
    const responses: string[] = [];

    for (const item of items) {
      const searchQuery = item.sku ?? item.name ?? "";
      if (!searchQuery) continue;

      const products = await this.tools.searchProducts(ctx, searchQuery);
      if (products.length === 0) {
        responses.push(`Product "${searchQuery}" not found.`);
        continue;
      }

      const product = products[0];
      responses.push(`${product.name} (${product.sku}): ${product.stockQuantity} in stock, price ${product.price}`);
    }

    if (responses.length > 0) {
      await this.sendOutboundMessage(ctx, conversation.id, responses.join("\n"));
    }
  }

  private async upsertCustomerByPhone(phone: string): Promise<Customer | null> {
    const repo = this.ds.getRepository(Customer);
    let customer = await repo.findOne({ where: { phone } });

    if (!customer) {
      customer = repo.create({
        name: `Customer ${phone.slice(-6)}`,
        phone,
        type: "individual",
      });
      await repo.save(customer);
    }

    return customer;
  }

  private async getOrCreateConversation(phone: string): Promise<Conversation> {
    const repo = this.ds.getRepository(Conversation);
    // Channel-aware key: telegram senders arrive as `tg:<id>` and their
    // thread was created at ingest time as `tg:<chatId>` (identical in DMs).
    const isTelegram = phone.startsWith("tg:");
    const prefix = isTelegram ? phone : `wa:${phone}:`;
    // Prefer the newest thread the channel ingest created for this sender
    // (ingest keys threads as `wa:<from>:<to>` / `tg:<chatId>`); fall back
    // to creating the canonical key only when no thread exists yet.
    const candidates = await repo.find({ where: {} });
    const mine = candidates
      .filter((c) => c.externalId === prefix || c.externalId.startsWith(prefix))
      .sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt));
    let conversation = mine[0] ?? null;

    if (!conversation) {
      conversation = repo.create({
        externalId: isTelegram ? prefix : `wa:${phone}:business`,
        channel: isTelegram ? "telegram" : "whatsapp",
        status: "open",
        customerId: null,
      });
      await repo.save(conversation);
    }

    return conversation;
  }

  private async persistInboundMessage(
    webhookEvent: WebhookEvent,
    phone: string,
    text: string,
    aiOutput: { intent: AiIntent; items: any[]; confidence: number },
  ): Promise<void> {
    const conversation = await this.getOrCreateConversation(phone);
    const messageRepo = this.ds.getRepository(Message);

    // The channel ingest already stored this inbound message; skip the
    // second insert instead of tripping the externalId unique key.
    const alreadyStored = await messageRepo.findOne({
      where: { externalId: webhookEvent.externalEventId },
    });
    if (alreadyStored) return;

    const message = messageRepo.create({
      conversationId: conversation.id,
      direction: "inbound",
      externalId: webhookEvent.externalEventId,
      status: "received",
      body: text,
      metadata: {
        from: webhookEvent.payload.from,
        to: webhookEvent.payload.to,
        rawStatus: webhookEvent.payload.status,
        timestamp: webhookEvent.payload.timestamp,
        aiIntent: aiOutput.intent,
        aiItems: aiOutput.items,
        aiConfidence: aiOutput.confidence,
      },
    });

    try {
      await messageRepo.save(message);
    } catch (err: any) {
      // Idempotency: the webhook controller already persisted the inbound
      // message (same externalId); a duplicate key here is not an error.
      if (typeof err?.message === "string" && err.message.includes("duplicate key")) {
        return;
      }
      throw err;
    }
  }

  private async sendOutboundMessage(
    ctx: ToolContext,
    conversationId: string,
    text: string,
  ): Promise<Message> {
    const msg = await this.tools.sendCustomerMessage(ctx, conversationId, text);
    return Array.isArray(msg) ? msg[0] : msg;
  }

  private async sendFallbackMessage(ctx: ToolContext, text: string): Promise<void> {
    const conversation = await this.getOrCreateConversation(ctx.phone);
    await this.tools.sendCustomerMessage(ctx, conversation.id, text);
  }

  private async markWebhookProcessed(webhookEvent: WebhookEvent): Promise<void> {
    await this.ds.getRepository(WebhookEvent).update(webhookEvent.id, {
      status: "processed",
    });
  }

  private async markWebhookFailed(webhookEvent: WebhookEvent, error: string): Promise<void> {
    await this.ds.getRepository(WebhookEvent).update(webhookEvent.id, {
      status: "failed",
      lastError: error,
    });
  }

  private async auditOrder(
    ctx: ToolContext,
    action: "create" | "update" | "delete" | "sync" | "approve" | "reject" | "cancel",
    entity: "customer" | "product" | "order" | "order_item" | "conversation" | "message" | "approval_request" | "integration_event" | "webhook_event" | "audit_log",
    target: string,
    success: boolean,
    input: unknown,
    note?: string,
  ): Promise<void> {
    await this.ds.getRepository(AuditLog).save(
      this.ds.getRepository(AuditLog).create({
        actor: "ai",
        source: "workflow",
        action,
        entity,
        entityId: target,
        inputSummary: JSON.stringify(input).slice(0, 300),
        result: success ? "success" : "failure",
        success,
        correlationId: ctx.correlationId,
        note: note ?? null,
      } as any),
    );
  }
}