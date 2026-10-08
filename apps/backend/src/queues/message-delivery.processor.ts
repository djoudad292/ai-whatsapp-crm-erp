import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { QUEUES } from "./queues.constants";

/**
 * Phase 8 placeholder for the message-delivery job: simulate a send that can
 * fail; after 3 attempts BullMQ marks it failed and we mark the Message failed
 * (handled by the producer/DB later). The structure proves retry wiring; the
 * real delivery can be swapped behind the same job name.
 */
@Processor(QUEUES.messageDelivery)
export class MessageDeliveryProcessor extends WorkerHost {
  async process(job: Job<{ conversationId: string; text: string }>): Promise<string> {
    // Demo knob: set MSG_DELIVERY_FAIL=true to force failures and exercise retry.
    if (process.env.MSG_DELIVERY_FAIL === "true") {
      throw new Error(`Simulated delivery failure (attempt=${job.attemptsMade + 1})`);
    }
    console.log(`[message-delivery] conv=${job.data.conversationId} text=${job.data.text}`);
    return "sent";
  }
}
