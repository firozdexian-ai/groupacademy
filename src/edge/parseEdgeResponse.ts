import type { ZodType } from "zod";
import { EdgeFunctionError } from "./EdgeFunctionError";

/**
 * Validate an edge-function response payload against a zod schema.
 * Throws `EdgeFunctionError` if the wire shape drifts — turning silent
 * casts into loud, typed failures at the call site.
 */
export function parseEdgeResponse<T>(
  fnName: string,
  schema: ZodType<T>,
  data: unknown,
): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new EdgeFunctionError(fnName, parsed.error);
  return parsed.data;
}
