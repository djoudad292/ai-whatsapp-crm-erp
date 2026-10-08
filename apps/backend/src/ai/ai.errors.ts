/**
 * Error taxonomy for the AI orchestration layer.
 *
 * The orchestrator is a deterministic stub today (no LLM dependency), but it
 * still has to reject malformed output: the schema validator throws
 * `AiValidationError` so callers get a typed, catchable failure instead of a
 * runtime crash from an unexpected shape.
 */

/** Output failed schema validation before it reached a tool. */
export class AiValidationError extends Error {
  readonly _tag = "AiValidationError";
  constructor(message: string, public readonly details?: string[]) {
    super(message);
    this.name = "AiValidationError";
    Object.setPrototypeOf(this, AiValidationError.prototype);
  }
}

/** A tool was invoked with arguments the registry does not understand. */
export class AiToolError extends Error {
  readonly _tag = "AiToolError";
  constructor(message: string, public readonly tool: string) {
    super(`${tool}: ${message}`);
    this.name = "AiToolError";
    Object.setPrototypeOf(this, AiToolError.prototype);
  }
}