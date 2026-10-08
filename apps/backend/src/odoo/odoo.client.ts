/**
 * Typed JSON-RPC client for Odoo 17.
 *
 * Protocol: POST {baseUrl}/jsonrpc with body
 *   {"jsonrpc":"2.0","method":"call","params":{"service":"object","method":..,"args":[..],"kwargs":{..}},"id":N}
 * Auth is a single call to `common`/`authenticate` returning the uid used for
 * every subsequent `object`/`execute_kw` call.
 *
 * No third-party dependency: the client is a thin wrapper around the global
 * `fetch` so the module has zero runtime deps and works behind any proxy.
 */
import { OdooConfig } from "./odoo.config";
import {
  OdooRpcError,
  OdooUnavailableError,
} from "./odoo.errors";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: "call" | "authenticate";
  params: {
    service: "common" | "object";
    method: string;
    args: unknown[];
    kwargs?: Record<string, unknown>;
  };
  id: number;
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

type CallOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

export class OdooClient {
  private uid: number | null = null;

  constructor(private readonly cfg: OdooConfig) {}

  /** True once a successful authenticate() has run. */
  get authenticated(): boolean {
    return this.uid !== null;
  }

  /**
   * Low-level JSON-RPC call. `method` is the Odoo model method (search, read,
   * create, write, ...) and `args` is the positional argument list.
   */
  async call<T = unknown>(
    model: string,
    method: string,
    args: unknown[] = [],
    kwargs: Record<string, unknown> = {},
    options?: CallOptions,
  ): Promise<T> {
    await this.ensureAuth(options);
    return this.rpc<T>("object", "execute_kw", [this.cfg.db, this.uid, this.cfg.password, model, method, args, kwargs], options);
  }

  /** Ping the server: authenticate + trivial call. Returns true on success. */
  async ping(): Promise<boolean> {
    await this.rpc<number>("common", "authenticate", [
      this.cfg.db,
      this.cfg.user,
      this.cfg.password,
      {},
    ]);
    return true;
  }

  /**
   * Force a fresh authentication, discarding any cached uid.
   * Useful after a 401-style failure or for health checks.
   */
  async authenticate(): Promise<number> {
    this.uid = null;
    this.uid = await this.rpc<number>("common", "authenticate", [
      this.cfg.db,
      this.cfg.user,
      this.cfg.password,
      {},
    ]);
    return this.uid;
  }

  private async ensureAuth(options?: CallOptions): Promise<void> {
    if (this.uid !== null) return;
    this.uid = await this.rpc<number>("common", "authenticate", [
      this.cfg.db,
      this.cfg.user,
      this.cfg.password,
      {},
    ], options);
  }

  private async rpc<T>(
    service: "common" | "object",
    method: string,
    params: unknown[],
    options?: CallOptions,
  ): Promise<T> {
    const url = `${this.cfg.baseUrl}/jsonrpc`;
    const body: JsonRpcRequest = {
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args: params },
      id: nextId(),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: options?.signal,
      });
    } catch (err) {
      // AbortController timeout or network failure.
      throw new OdooUnavailableError(
        `Odoo unreachable at ${url}: ${err instanceof Error ? err.message : String(err)}`,
        err,
      );
    }

    if (!response.ok) {
      throw new OdooUnavailableError(
        `Odoo responded with HTTP ${response.status} at ${url}`,
      );
    }

    let payload: JsonRpcResponse<T>;
    try {
      payload = (await response.json()) as JsonRpcResponse<T>;
    } catch (err) {
      throw new OdooUnavailableError(
        `Odoo returned non-JSON response at ${url}`,
        err,
      );
    }

    if (payload.error) {
      throw new OdooRpcError(
        payload.error.message ?? "Odoo JSON-RPC error",
        payload.error.code,
        payload.error.data,
      );
    }

    return payload.result as T;
  }
}

let _id = 0;
function nextId(): number {
  _id += 1;
  return _id;
}