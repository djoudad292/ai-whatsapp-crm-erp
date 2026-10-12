import { Controller, Post, Query } from "@nestjs/common";
import { DeliveryService, DrainReport } from "./delivery.service";

/**
 * Retry endpoint for queued outbound messages.
 *
 * Point a Netlify scheduled function (or any cron) at POST
 * /api/delivery/drain?limit=20 and it will retry whatever is due. Requires a
 * token because it costs money on every send attempt.
 */
@Controller("api/delivery")
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}

  @Post("drain")
  async drain(@Query("limit") limit?: string): Promise<DrainReport> {
    const max = Math.min(Math.max(Number(limit) || 20, 1), 100);
    return this.delivery.drain(max);
  }
}