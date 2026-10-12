/**
 * Validation DTO for the mock WhatsApp gateway inbound webhook.
 *
 * The mock gateway (frontend) POSTs customer messages here with a payload
 * shaped like a real WhatsApp business webhook:
 *   { id, timestamp, from, to, text, status }
 *
 * `status` is the simulated delivery status (queued | delivered | failed).
 * Validation is manual (no class-validator dependency) so the module has zero
 * extra runtime dependencies.
 */
export type WhatsAppMessageStatus = "queued" | "delivered" | "failed";

export interface WhatsAppWebhookPayload {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  text: string;
  status: WhatsAppMessageStatus;
}

const REQUIRED_FIELDS: (keyof WhatsAppWebhookPayload)[] = [
  "id",
  "timestamp",
  "from",
  "to",
  "text",
  "status",
];

export function validateWhatsAppPayload(
  body: unknown,
): { valid: true; payload: WhatsAppWebhookPayload } | { valid: false; errors: string[] } {
  const errors: string[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, errors: ["body must be a JSON object"] };
  }

  const record = body as Record<string, unknown>;

  for (const field of REQUIRED_FIELDS) {
    const value = record[field];
    if (value === undefined || value === null || value === "") {
      errors.push(`missing field: ${field}`);
    } else if (typeof value !== "string") {
      errors.push(`field ${field} must be a string`);
    }
  }

  if (record.status && !["queued", "delivered", "failed"].includes(record.status as string)) {
    errors.push("status must be one of: queued, delivered, failed");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, payload: record as unknown as WhatsAppWebhookPayload };
}