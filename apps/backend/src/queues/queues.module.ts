import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { MessageDeliveryProcessor } from "./message-delivery.processor";
import { QUEUES } from "./queues.constants";

/**
 * Defaults applied to every queue: 3 attempts, exponential-ish backoff,
 * keep last 100 completed/failed jobs. Each queue exists for a specific
 * reason (see README) — no gratuitous queues.
 */
const defaults = {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential" as const, delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
};

@Module({
  imports: [
    BullModule.forRoot({
      connection: { host: process.env.REDIS_HOST ?? "localhost", port: Number(process.env.REDIS_PORT ?? 6379) },
    }),
    BullModule.registerQueue(
      { name: QUEUES.incomingEvents, ...defaults },
      { name: QUEUES.erpSync, ...defaults },
      { name: QUEUES.messageDelivery, ...defaults },
      { name: QUEUES.retryEvents, ...defaults },
    ),
  ],
  providers: [MessageDeliveryProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
