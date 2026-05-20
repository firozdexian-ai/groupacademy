/**
 * Shared throwable for typed edge-function wrappers (Phase 9).
 *
 * Every `<domain>Api.<fn>` rejects with one of these when
 * `supabase.functions.invoke` returns a non-null `error`.
 */
export class EdgeFunctionError extends Error {
  readonly fnName: string;
  readonly cause?: unknown;

  constructor(fnName: string, cause?: unknown) {
    const causeMessage =
      cause && typeof cause === "object" && "message" in cause
        ? String((cause as { message: unknown }).message)
        : String(cause ?? "unknown error");
    super(`edge function ${fnName} failed: ${causeMessage}`);
    this.name = "EdgeFunctionError";
    this.fnName = fnName;
    this.cause = cause;
  }
}
