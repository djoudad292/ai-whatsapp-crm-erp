import { describe, expect, it } from "vitest";
import {
  AiOrchestratorService,
  AiOutputSchema,
  extractItems,
  parseIntent,
} from "./ai.orchestrator.service";
import { AiValidationError } from "./ai.errors";
import { validateWhatsAppPayload } from "../webhooks/webhooks.dto";

describe("parseIntent", () => {
  it("detects order intent incl. the Nx shorthand (regression)", () => {
    expect(parseIntent("I want 2x Product A").intent).toBe("order");
    expect(parseIntent("buy 3 widgets").intent).toBe("order");
    expect(parseIntent("I want 5 units of Product C").intent).toBe("order");
  });
  it("detects inquiry intent", () => {
    expect(parseIntent("What is the stock for Product B?").intent).toBe("inquiry");
    expect(parseIntent("price of Product A").intent).toBe("inquiry");
  });
  it("falls back to unknown", () => {
    expect(parseIntent("hello there").intent).toBe("unknown");
    expect(parseIntent("").intent).toBe("unknown");
  });
});

describe("extractItems", () => {
  it("parses quantity + name pairs", () => {
    expect(extractItems("I want 2x Product A")).toEqual([{ name: "Product A", quantity: 2 }]);
    expect(extractItems("I want 5 units of Product C")).toEqual([{ name: "Product C", quantity: 5 }]);
  });
  it("returns [] when no quantity present", () => {
    expect(extractItems("What is the stock for Product B?")).toEqual([]);
  });
});

describe("AiOutputSchema", () => {
  it("accepts a valid output", () => {
    expect(() =>
      AiOutputSchema.parse({ intent: "order", items: [{ name: "Product A", quantity: 2 }], confidence: 0.9 }),
    ).not.toThrow();
  });
  it("rejects invalid intent, bad quantity, bad confidence", () => {
    expect(() => AiOutputSchema.parse({ intent: "hack", items: [], confidence: 0.5 })).toThrow(AiValidationError);
    expect(() => AiOutputSchema.parse({ intent: "order", items: [{ name: "X", quantity: 0 }], confidence: 0.5 })).toThrow(
      AiValidationError,
    );
    expect(() => AiOutputSchema.parse({ intent: "order", items: [], confidence: 9 })).toThrow(AiValidationError);
  });
});

describe("AiOrchestratorService.orchestrate (stub path)", () => {
  it("parses an order end to end without an LLM", () => {
    const out = new AiOrchestratorService().orchestrate("I want 2x Product A");
    expect(out.intent).toBe("order");
    expect(out.items).toEqual([{ name: "Product A", quantity: 2 }]);
  });
  it("rejects empty text", () => {
    expect(() => new AiOrchestratorService().orchestrate("   ")).toThrow(AiValidationError);
  });
});

describe("validateWhatsAppPayload", () => {
  const good = {
    id: "w-1", timestamp: "2026-10-09T00:00:00Z",
    from: "+213555000001", to: "demo", text: "hi", status: "delivered",
  };
  it("accepts a well-formed payload", () => {
    expect(validateWhatsAppPayload(good).valid).toBe(true);
  });
  it("rejects missing/invalid fields", () => {
    expect(validateWhatsAppPayload({ ...good, id: undefined }).valid).toBe(false);
    expect(validateWhatsAppPayload({ ...good, status: "bogus" }).valid).toBe(false);
    expect(validateWhatsAppPayload(null).valid).toBe(false);
    expect(validateWhatsAppPayload("nope").valid).toBe(false);
  });
});
