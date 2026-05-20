/**
 * Analytics domain — typed edge function wrappers (Phase 9g).
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  AdminReportBuilderResponseSchema,
  type AdminReportBuilderRequest,
  type AdminReportBuilderResponse,
} from "@/edge/contracts/analytics";

export async function adminReportBuilder(
  req: AdminReportBuilderRequest,
): Promise<AdminReportBuilderResponse> {
  const { data, error } = await supabase.functions.invoke(
    "admin-report-builder",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("admin-report-builder", error);
  return parseEdgeResponse(
    "admin-report-builder",
    AdminReportBuilderResponseSchema,
    data ?? {},
  );
}
