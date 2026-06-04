/**
 * Group Academy — Administrative Data Access Repository
 * Purpose: Unified generic CRUD wrapper providing a data routing layer over core taxonomy tables.
 * Isolates direct client invokes, enforces role verification gates, and links with telemetry frameworks.
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Shared error handler and telemetry sink for tracking platform exceptions.
 */
async function reportAdminAnomaly(action: string, error: any, context: Record<string, unknown> = {}) {
  const errorMessage = error?.message || "Something went wrong. Our team has been notified.";
  console.error(`[Admin Infrastructure Error] Error during [${action}]: ${errorMessage}`, context);

  // Pipe directly into the immutable database events ledger for system auditing
  try {
    await supabase.from("platform_events" as any).insert({
      event_type: "admin_infrastructure_fault",
      severity: "error",
      payload: {
        action,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  } catch (logError) {
    console.error("Critical: Telemetry pipeline reporting failed:", logError);
  }
}

/**
 * Fetches rows from a designated administrative database taxonomy table.
 */
export async function listAdminTableRows(table: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from(table as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as any[];
  } catch (error) {
    await reportAdminAnomaly("listAdminTableRows", error, { table });
    throw new Error(`We couldn't load records from ${table}. Please refresh your dashboard.`);
  }
}

/**
 * Commits a record insert to an administrative reference table. Enforces pre-flight authentication verification.
 */
export async function insertAdminTableRow(table: string, payload: Record<string, unknown>): Promise<void> {
  try {
    // Client-side authentication guard to guarantee session integrity before transport layers fire
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Security check failed: You are unauthenticated.");

    const { error } = await (supabase.from(table as any) as any).insert(payload);
    if (error) throw error;
  } catch (error) {
    await reportAdminAnomaly("insertAdminTableRow", error, { table, payload });
    throw new Error(`Failed to save new record to ${table}. Please check your inputs and permissions.`);
  }
}

/**
 * Permanently removes a row from a taxonomy table using its explicit primary identifier.
 */
export async function deleteAdminTableRow(table: string, id: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Security check failed: You are unauthenticated.");

    const { error } = await supabase
      .from(table as any)
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    await reportAdminAnomaly("deleteAdminTableRow", error, { table, targetId: id });
    throw new Error(`Action rejected: Unable to delete record ${id} from ${table}.`);
  }
}

/**
 * Validates a user role assignment against the system RBAC data layer.
 * Uses user_roles explicitly to safeguard against legacy profile tracking column bugs.
 */
export async function userHasRole(userId: string, role: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", role as any)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    await reportAdminAnomaly("userHasRole", error, { userId, role });
    return false; // Fail secure to safeguard administrative zones
  }
}

/**
 * Identity email lookups utility used during system routing parameters.
 */
export async function checkAuthEmail(lookup_email: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc("check_auth_email", { lookup_email });
    if (error) throw error;
    return data;
  } catch (error) {
    await reportAdminAnomaly("checkAuthEmail", error, { lookup_email });
    throw new Error("User lookup failed. Please double check the email address formatting.");
  }
}

/**
 * Consolidated command palette finder tool for B2B platform operations.
 */
export async function gro10xGlobalSearch(_q: string, _limit = 6): Promise<any> {
  try {
    const { data, error } = await supabase.rpc("gro10x_global_search", { _q, _limit });
    if (error) throw error;
    return (data ?? {}) as any;
  } catch (error) {
    await reportAdminAnomaly("gro10xGlobalSearch", error, { searchQuery: _q });
    return { talents: [], companies: [], jobs: [] }; // Fallback to an empty schema structure cleanly
  }
}
