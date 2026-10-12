import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DeliveryService } from "./delivery.service";

/**
 * Delivery semantics that matter in production:
 *  - a retryable failure must stay queued with a backoff, not be lost
 *  - a permanent failure must stop retrying and be marked failed
 *  - a success must persist the provider message id
 *  - missing credentials must never drop the message
 *
 * The DataSource is mocked so these stay unit tests with no database.
 */
describe("DeliveryService", () => {
  let svc: any;
  let repo: any;
  let convRepo: any;
  let fetchMock: any;

  const makeMessage = (overrides: any = {}) => ({
    id: "m1",
    conversationId: "c1",
    direction: "outbound",
    status: "queued",
    body: "Order created",
    deliveryAttempts: 0,
    deliveryError: null,
    nextAttemptAt: null,
    ...overrides,
  });

  beforeEach(() => {
    repo = {
      findOne: vi.fn().mockResolvedValue(makeMessage()),
      save: vi.fn().mockImplementation((m: any) => Promise.resolve(m)),
      createQueryBuilder: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      }),
    };
    convRepo = {
      findOne: vi.fn().mockResolvedValue({
        id: "c1",
        channel: "whatsapp",
        externalId: "wa:+2135500111:demo",
      }),
    };
    const ds = { getRepository: vi.fn((e: any) => (e?.name === "Message" || e === undefined ? repo : convRepo)) };
    ds.getRepository = vi.fn((entity: any) => {
      const n = entity?.name ?? entity?.constructor?.name;
      return n === "Message" ? repo : convRepo;
    });

    fetchMock = vi.fn();
    global.fetch = fetchMock as any;

    process.env.WHATSAPP_PHONE_NUMBER_ID = "123456";
    process.env.WHATSAPP_ACCESS_TOKEN = "token";
    process.env.TELEGRAM_BOT_TOKEN = undefined;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    svc = new DeliveryService(ds);
  });

  afterEach(() => {
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    vi.restoreAllMocks();
  });

  it("marks sent and stores the wamid on success", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ messages: [{ id: "wamid.ABC" }] }),
    });

    const result = await svc.attempt("m1");
    expect(result.ok).toBe(true);
    const saved = repo.save.mock.calls.at(-1)![0];
    expect(saved.status).toBe("sent");
    expect(saved.externalId).toBe("wamid.ABC");
    expect(saved.deliveryAttempts).toBe(1);
  });

  it("keeps a retryable failure queued with a backoff", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: { code: 4, message: "rate limit" } }),
    });

    const result = await svc.attempt("m1");
    expect(result.ok).toBe(false);
    expect(result.retryable).toBe(true);
    const saved = repo.save.mock.calls.at(-1)![0];
    expect(saved.status).toBe("queued");
    expect(saved.deliveryAttempts).toBe(1);
    expect(saved.nextAttemptAt).toBeInstanceOf(Date);
  });

  it("marks a permanent failure as failed without retrying", async () => {
    // 131026 = message undeliverable: retrying will never help.
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({ error: { code: 131026, error_data: { details: "not deliverable" } } }),
    });

    const result = await svc.attempt("m1");
    expect(result.retryable).toBe(false);
    const saved = repo.save.mock.calls.at(-1)![0];
    expect(saved.status).toBe("failed");
    expect(saved.nextAttemptAt).toBeNull();
  });

  it("never drops the message when credentials are absent", async () => {
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    const result = await svc.attempt("m1");
    expect(result.ok).toBe(false);
    const saved = repo.save.mock.calls.at(-1)![0];
    expect(saved.status).toBe("queued");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stops retrying once attempts are exhausted", async () => {
    repo.findOne.mockResolvedValue(makeMessage({ deliveryAttempts: 5 }));
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: { message: "boom" } }),
    });

    await svc.attempt("m1");
    const saved = repo.save.mock.calls.at(-1)![0];
    expect(saved.status).toBe("failed");
  });
});