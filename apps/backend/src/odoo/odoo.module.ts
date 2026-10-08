import { Module, Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OdooClient } from "./odoo.client";
import { resolveOdooConfig } from "./odoo.config";

let cachedClient: OdooClient | null = null;

function getClient(): OdooClient {
  if (!cachedClient) {
    const configMock = { get: (key: string) => process.env[key] } as unknown as ConfigService;
    cachedClient = new OdooClient(resolveOdooConfig(configMock));
  }
  return cachedClient;
}

@Controller("api/health")
export class OdooHealthController {
  @Get("odoo")
  async ping() {
    try {
      await getClient().ping();
      return { status: "ok", odoo: "reachable" };
    } catch (e: any) {
      return { status: "down", detail: e.message };
    }
  }
}

@Module({
  controllers: [OdooHealthController],
  exports: [],
})
export class OdooModule {}
