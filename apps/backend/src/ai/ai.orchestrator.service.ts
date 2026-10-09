/**
 * AiOrchestratorService — deterministic intent parser (stub).
 *
 * Phase 6: turns WhatsApp-style free text into structured JSON
 *   { intent, items }
 * without any LLM dependency. The parser is a small set of regex rules:
 *   - buy / order / purchase / reserve  -> intent "order"  (order flow)
 *   - stock / price / inventory / ...   -> intent "inquiry" (info flow)
 *   - anything else                    -> intent "unknown"
 *
 * The output is validated against a Zod-style schema (see `AiOutputSchema`).
 * Invalid output throws `AiValidationError`; the caller decides what to do.
 */

import { AiValidationError } from "./ai.errors";

export type AiIntent = "order" | "inquiry" | "unknown";

export interface AiOrderItem {
  sku?: string;
  name?: string;
  quantity: number;
}

export interface AiOutput {
  intent: AiIntent;
  items: AiOrderItem[];
  confidence: number;
}

const VALID_INTENTS: readonly AiIntent[] = ["order", "inquiry", "unknown"];

const ORDER_RE = /\b(buy|purchase|order|reserve|book|get\s+\d+|want\s+\d+|need\s+\d+)/i;
const INQUIRY_RE = /\b(stock|price|prices|inventory|available|catalog|do\s+you\s+have|what.s\s+the\s+price)\b/i;

/**
 * Extract (quantity, name) pairs from free text. Handles the common forms a
 * customer types on WhatsApp: "2x Product A", "3 of widget", "5 units of gizmo".
 */
function extractItems(text: string): AiOrderItem[] {
  const items: AiOrderItem[] = [];
  const re = /(\d+)\s*(?:x|units?|of|\s|-)*\s*(?:of\s+)?([A-Za-z][A-Za-z0-9 \-']{1,40}?)(?=\s*\d+\s*(?:x|units?|of)?\s*[A-Za-z]|\s*$|\.|,)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const quantity = parseInt(m[1], 10);
    const name = m[2].trim().replace(/\s+/g, " ").replace(/^of\s+/i, "");
    if (quantity > 0 && name.length > 0) {
      items.push({ name, quantity });
    }
  }
  return items;
}

function parseIntent(text: string): { intent: AiIntent; confidence: number } {
  const t = text.toLowerCase();
  if (ORDER_RE.test(t)) return { intent: "order", confidence: 0.9 };
  if (INQUIRY_RE.test(t)) return { intent: "inquiry", confidence: 0.8 };
  return { intent: "unknown", confidence: 0.4 };
}

/**
 * Zod-style schema for the orchestrator output.
 *
 * `parse()` mirrors Zod's `schema.parse(data)`: it returns the typed value on
 * success and throws `AiValidationError` on failure, with the list of problems.
 */
export const AiOutputSchema = {
  parse(data: unknown): AiOutput {
    const errors: string[] = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new AiValidationError("output must be a JSON object", ["root must be an object"]);
    }

    const o = data as Record<string, unknown>;

    if (typeof o.intent !== "string" || !(VALID_INTENTS as readonly string[]).includes(o.intent)) {
      errors.push(`intent must be one of: ${VALID_INTENTS.join(", ")}`);
    }

    if (!Array.isArray(o.items)) {
      errors.push("items must be an array");
    } else {
      for (let i = 0; i < o.items.length; i += 1) {
        const item = o.items[i];
        if (!item || typeof item !== "object") {
          errors.push(`items[${i}] must be an object`);
          continue;
        }
        const it = item as Record<string, unknown>;
        if (typeof it.quantity !== "number" || !Number.isFinite(it.quantity) || it.quantity <= 0) {
          errors.push(`items[${i}].quantity must be a positive number`);
        }
        if (it.sku !== undefined && typeof it.sku !== "string") {
          errors.push(`items[${i}].sku must be a string`);
        }
        if (it.name !== undefined && typeof it.name !== "string") {
          errors.push(`items[${i}].name must be a string`);
        }
      }
    }

    if (o.confidence !== undefined && (typeof o.confidence !== "number" || o.confidence < 0 || o.confidence > 1)) {
      errors.push("confidence must be a number between 0 and 1");
    }

    if (errors.length > 0) {
      throw new AiValidationError(`invalid AI output: ${errors.join("; ")}`, errors);
    }

    return {
      intent: o.intent as AiIntent,
      items: (o.items as AiOrderItem[]).map((it) => ({
        sku: it.sku,
        name: it.name,
        quantity: it.quantity,
      })),
      confidence: typeof o.confidence === "number" ? o.confidence : 0.5,
    };
  },
};

export class AiOrchestratorService {
  /**
   * Parse `text` into a validated `{ intent, items }` object.
   * Throws `AiValidationError` if the produced output fails the schema.
   */
  orchestrate(text: string): AiOutput {
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new AiValidationError("text must be a non-empty string");
    }

    const { intent, confidence } = parseIntent(text);
    const items = extractItems(text);

    return AiOutputSchema.parse({ intent, items, confidence });
  }

  /**
   * Production path: if an LLM is configured (LLM_BASE_URL + LLM_API_KEY +
   * LLM_MODEL, OpenAI-compatible endpoint, e.g. local OmniRoute gateway),
   * ask the model for a structured intent JSON object and validate it with
   * the same schema. Falls back to the deterministic stub on any error so
   * the workflow never silently disappears.
   */
  async orchestrateSmart(text: string): Promise<AiOutput> {
    const base = process.env.LLM_BASE_URL;
    const key = process.env.LLM_API_KEY;
    const model = process.env.LLM_MODEL ?? "omniroute/oc/deepseek-v4-flash-free";
    if (!base || !key) {
      return this.orchestrate(text);
    }
    try {
      const prompt =
        'You extract a shopping intent from a WhatsApp message. Reply ONLY with compact JSON: {"intent":"order"|"inquiry"|"unknown","items":[{"name"?:string,"sku"?:string,"quantity":number}],"confidence":0.0-1.0}. No other text.';
      const res = await fetch(`${base.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: text },
          ],
          temperature: 0,
        }),
      });
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
      const data: any = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? "";
      return AiOutputSchema.parse(JSON.parse(content));
    } catch (e: any) {
      console.warn(`[ai] LLM path failed (${e.message}); falling back to stub parser.`);
      return this.orchestrate(text);
    }
  }
}