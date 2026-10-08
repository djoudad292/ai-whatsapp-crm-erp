import { Controller, Get } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

@Controller("api/metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  getMetrics() {
    return this.metricsService.getMetrics();
  }
}