import { Controller, Get } from "@nestjs/common";

// Mounted at both paths: "health" for direct/redirect access and "api/health"
// for the Netlify function (which forwards /api/* verbatim). The static
// export's /health page shadows the redirect in production, so the dashboard
// probes /api/health.
@Controller(["health", "api/health"])
export class HealthController {
  @Get()
  health() {
    return { status: "ok" };
  }
}