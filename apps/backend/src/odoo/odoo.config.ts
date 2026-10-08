import { ConfigService } from "@nestjs/config";

/**
 * Resolved Odoo connection settings from the environment.
 *
 * Variables (see README.md):
 *   ODOO_URL      - base URL of the Odoo instance, e.g. http://odoo:8069
 *   ODOO_DB       - database name to authenticate against
 *   ODOO_USER     - database user
 *   ODOO_PASSWORD - database user password
 */
export interface OdooConfig {
  baseUrl: string;
  db: string;
  user: string;
  password: string;
  timeoutMs: number;
}

/**
 * Build an OdooConfig from the NestJS ConfigService.
 * Throws a clear error if the required variables are missing so the failure
 * is loud at startup rather than on the first RPC.
 */
export function resolveOdooConfig(configService: ConfigService): OdooConfig {
  const baseUrl = configService.get<string>("ODOO_URL");
  const db = configService.get<string>("ODOO_DB");
  const user = configService.get<string>("ODOO_USER");
  const password = configService.get<string>("ODOO_PASSWORD");

  const missing = [
    !baseUrl && "ODOO_URL",
    !db && "ODOO_DB",
    !user && "ODOO_USER",
    !password && "ODOO_PASSWORD",
  ].filter((v): v is string => typeof v === "string");

  if (missing.length > 0) {
    throw new Error(
      `Odoo configuration is incomplete. Missing: ${missing.join(", ")}. ` +
        "Set them in the environment or .env (see README.md).",
    );
  }

  return {
    baseUrl: baseUrl!.replace(/\/+$/, ""),
    db: db!,
    user: user!,
    password: password!,
    timeoutMs: Number(configService.get<string>("ODOO_TIMEOUT_MS") ?? "15000"),
  };
}