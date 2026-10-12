/**
 * Minimal WhatsApp Cloud API client.
 *
 * Talks to the Graph API directly with fetch so the module keeps zero runtime
 * dependencies. Only the outbound paths the agent needs are implemented:
 * plain text and approved template messages.
 */

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
  timeoutMs: number;
}

export interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  retryable?: boolean;
  code?: number;
}

export function whatsappConfigFromEnv(): WhatsAppConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) return null;
  return {
    phoneNumberId,
    accessToken,
    apiVersion: process.env.WHATSAPP_API_VERSION ?? "v21.0",
    timeoutMs: Number(process.env.WHATSAPP_TIMEOUT_MS ?? 10000),
  };
}

/**
 * Meta error codes that are worth retrying: throttling, transient upstream and
 * message-level temporary failures. Everything else (bad token, undeliverable
 * recipient, malformed payload) is permanent and must not be retried forever.
 */
const RETRYABLE_CODES = new Set([
  1, // transient
  2, // service temporarily unavailable
  4, // rate limit hit
  341, // API too many calls
  131047, // re-engagement rate limit
  131056, // pair rate limit hit
  131008, // required action unavailable
  368, // temporarily blocked
  429, // rate limited
]);

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export class WhatsAppClient {
  constructor(private readonly cfg: WhatsAppConfig) {}

  private endpoint(): string {
    return `https://graph.facebook.com/${this.cfg.apiVersion}/${this.cfg.phoneNumberId}/messages`;
  }

  private async post(payload: Record<string, unknown>): Promise<SendResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.cfg.timeoutMs);
    try {
      const res = await fetch(this.endpoint(), {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.cfg.accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
        signal: controller.signal,
      });

      const text = await res.text();
      let parsed: any = {};
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { raw: text };
      }

      if (!res.ok) {
        const err = parsed?.error ?? {};
        const code = Number(err?.code ?? res.status);
        const detail = err?.error_data?.details ?? err?.message ?? `HTTP ${res.status}`;
        return {
          ok: false,
          error: String(detail).slice(0, 500),
          code,
          retryable: RETRYABLE_CODES.has(code) || isRetryableStatus(res.status),
        };
      }

      const messageId = parsed?.messages?.[0]?.id;
      if (!messageId) {
        return {
          ok: false,
          error: `Cloud API returned no message id: ${text.slice(0, 200)}`,
          retryable: true,
        };
      }
      return { ok: true, messageId };
    } catch (err: any) {
      // Abort/timeout/network faults are worth another attempt.
      return {
        ok: false,
        error: `transport: ${err?.message ?? String(err)}`.slice(0, 500),
        retryable: true,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  /** Send a free-form text message. Subject to the 24h customer-service window. */
  async sendText(to: string, body: string): Promise<SendResult> {
    return this.post({
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body },
    });
  }

  /** Send a pre-approved template; the only way to message outside the 24h window. */
  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    parameters: string[] = [],
  ): Promise<SendResult> {
    return this.post({
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(parameters.length ? { components: [{ type: "body", parameters: parameters.map((p) => ({ type: "text", text: p })) }] } : {}),
      },
    });
  }
}