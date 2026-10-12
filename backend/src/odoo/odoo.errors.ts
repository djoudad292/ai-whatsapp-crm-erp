/**
 * Error taxonomy for the Odoo client.
 *
 * All failures are mapped to a small set of typed errors so callers can
 * branch on `instanceof` rather than parsing strings.
 */

/** Odoo server is unreachable (network/DNS, refused, timed out, non-2xx). */
export class OdooUnavailableError extends Error {
  readonly _tag = "OdooUnavailableError";
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "OdooUnavailableError";
    Object.setPrototypeOf(this, OdooUnavailableError.prototype);
  }
}

/** Odoo returned a JSON-RPC error object (e.g. validation failure, missing id). */
export class OdooRpcError extends Error {
  readonly _tag = "OdooRpcError";
  constructor(
    message: string,
    public readonly code: number | null,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "OdooRpcError";
    Object.setPrototypeOf(this, OdooRpcError.prototype);
  }
}

/** A value failed schema validation before leaving the client. */
export class OdooValidationError extends Error {
  readonly _tag = "OdooValidationError";
  constructor(message: string) {
    super(message);
    this.name = "OdooValidationError";
    Object.setPrototypeOf(this, OdooValidationError.prototype);
  }
}