import { Controller, Get, Inject } from "@nestjs/common";
import { DataSource } from "typeorm";
import { getDataSourceToken } from "@nestjs/typeorm";

// Mounted at both paths: "health" for direct/redirect access and "api/health"
// for the Netlify function (which forwards /api/* verbatim). The static
// export's /health page shadows the redirect in production, so the dashboard
// probes /api/health.
@Controller(["health", "api/health"])
export class HealthController {
  constructor(
    @Inject(getDataSourceToken()) private readonly ds: DataSource,
  ) {}

  @Get()
  health() {
    return {
      status: "ok",
      database: this.ds.isInitialized ? "connected" : "disconnected",
    };
  }
}