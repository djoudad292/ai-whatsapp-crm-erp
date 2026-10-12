/**
 * Generates backend/config.json from .env at build time.
 *
 * Netlify runtime env vars require dashboard/API access to set, which this
 * machine's token cannot do. Baking the values into the bundle at build time
 * keeps the secret out of git (config.json is gitignored) while still letting
 * the function reach Neon. process.env always wins when a real env var exists.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, "../.env");
const outPath = resolve(here, "../backend/config.json");

const wanted = [
  "DATABASE_URL",
  "DATABASE_SSL",
  "AUTH_SECRET",
  "NODE_ENV",
  "QUEUES_ENABLED",
  "DB_SYNCHRONIZE",
  "LLM_BASE_URL",
  "LLM_API_KEY",
  "LLM_MODEL",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_ACCESS_TOKEN",
];

const env = {};
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
}

const config = {};
for (const key of wanted) {
  if (env[key]) config[key] = env[key];
}
if (config.DATABASE_URL) config.DATABASE_SSL = config.DATABASE_SSL ?? "true";

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(config, null, 2));

console.log(
  `[build-config] wrote ${outPath} with keys: ${Object.keys(config).join(", ") || "(none)"}`,
);