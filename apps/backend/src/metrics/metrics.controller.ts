import { Controller, Get, Inject } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

@Controller("api/metrics")
export class MetricsController {
  constructor(@Inject(MetricsService) private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics() {
    return this.metricsService.getMetrics();
  }
}