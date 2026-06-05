/**
 * Workforce domain repository (Phase 10i.2).
 *
 * Centralises all raw supabase.from(...) calls for the HR/Workforce admin area:
 * - HR org chart master (verticals/functions/teams/grades + headcount rollups)
 * - HR onboarding tasks & payroll runs (with workforce-member join)
 * - Workforce member listing/insert/talent search helpers
 *
 * Mutations use a generic `upsertGraphRow` / `deleteGraphRow` factory pattern
 * so consumer hooks remain thin.
 */
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// Generic Graph factories
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertGraphRow(table: string, payload: any): Promise<void> {
  if (payload?.id) {
    const { id, ...patch } = payload;
    const { error } = await supabase.from(table as any).update(patch).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from(table as any).insert([payload]);
    if (error) throw error;
  }
}

export async function deleteGraphRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table as any).delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// HR Org Graph master
// ─────────────────────────────────────────────────────────────────────────────

export async function getHrGraphMaster() {
  const [verticalsRes, functionsRes, teamsRes, gradesRes, workforceRes] = await Promise.all([
    supabase.from("hr_verticals").select("*").order("name"),
    supabase.from("hr_functions").select("*").order("name"),
    supabase.from("hr_teams").select("*").order("name"),
    supabase.from("hr_grades").select("*").order("level", { ascending: true }),
    supabase.from("workforce_members").select("id, team_id, grade_id").eq("status", "active"),
  ]);
  if (verticalsRes.error) throw verticalsRes.error;
  if (functionsRes.error) throw functionsRes.error;
  if (teamsRes.error) throw teamsRes.error;
  if (gradesRes.error) throw gradesRes.error;
  if (workforceRes.error) throw workforceRes.error;
  return {
    verticals: verticalsRes.data ?? [],
    functions: functionsRes.data ?? [],
    teams: teamsRes.data ?? [],
    grades: gradesRes.data ?? [],
    workforce: workforceRes.data ?? [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HR Onboarding
// ─────────────────────────────────────────────────────────────────────────────

export async function getHrOnboardingMaster() {
  const [tasksRes, workforceRes] = await Promise.all([
    supabase.from("hr_onboarding_tasks").select("*").order("due_date", { ascending: true }),
    supabase
      .from("workforce_members")
      .select("user_id, talent_id, talents(full_name)")
      .eq("status", "active"),
  ]);
  if (tasksRes.error) throw tasksRes.error;
  if (workforceRes.error) throw workforceRes.error;
  return {
    tasks: (tasksRes.data ?? []) as any[],
    workforce: (workforceRes.data ?? []) as any[],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HR Payroll
// ─────────────────────────────────────────────────────────────────────────────

export async function getHrPayrollMaster() {
  const [payrollRes, workforceRes] = await Promise.all([
    supabase.from("hr_payroll_runs").select("*").order("period_end", { ascending: false }),
    supabase
      .from("workforce_members")
      .select("user_id, talents(full_name)")
      .eq("status", "active"),
  ]);
  if (payrollRes.error) throw payrollRes.error;
  if (workforceRes.error) throw workforceRes.error;
  return {
    runs: (payrollRes.data ?? []) as any[],
    workforce: (workforceRes.data ?? []) as any[],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Workforce member search & creation
// ─────────────────────────────────────────────────────────────────────────────

export async function searchTalentsByNameOrEmail(searchPattern: string): Promise<any[]> {
  const { data } = await supabase
    .from("talents")
    .select("id, full_name, email")
    .or(`full_name.ilike.%${searchPattern}%,email.ilike.%${searchPattern}%`)
    .limit(5);
  return data ?? [];
}

export async function insertWorkforceMember(payload: Record<string, any>): Promise<void> {
  const { error } = await supabase.from("workforce_members").insert(payload as any);
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// Phase 10j.3b additions
// -----------------------------------------------------------------------------

export async function findWorkforceInstanceByCluster(clusterGeoId: string): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("workforce_hired_instances")
    .select("id")
    .eq("cluster_geo_id", clusterGeoId)
    .limit(1)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function getActiveWorkforceTemplateByKey(agentKey: string): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("workforce_master_templates")
    .select("id")
    .eq("agent_key", agentKey)
    .eq("is_active", true)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function insertWorkforceInstanceReturningId(payload: {
  template_id: string;
  tenant_id: string;
  cluster_geo_id: string;
  name_override: string;
  status: string;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from("workforce_hired_instances")
    .insert(payload)
    .select("id")
    .single();
  if (error || !data?.id) return null;
  return data.id as string;
}

// ─── Phase 10j.5e: command center counters + rule mgmt ─────────────────────
export async function countActiveWorkforceChannelConnections(): Promise<number> {
  const { count } = await (supabase as any)
    .from("workforce_channel_connections")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);
  return count ?? 0;
}

export async function countActiveWorkforceRoutingRules(): Promise<number> {
  const { count } = await (supabase as any)
    .from("workforce_routing_rules")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);
  return count ?? 0;
}

export async function deleteWorkforceRoutingRule(id: string): Promise<void> {
  const { error } = await (supabase as any).from("workforce_routing_rules").delete().eq("id", id);
  if (error) throw error;
}

// ─── Phase 10j.5f: command center channel + rule CRUD ──────────────────────
export async function listWorkforceChannelConnections(): Promise<any[]> {
  const { data, error } = await (supabase as any)
    .from("workforce_channel_connections")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function deleteWorkforceChannelConnection(id: string): Promise<void> {
  const { error } = await (supabase as any).from("workforce_channel_connections").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertWorkforceChannelConnection(
  payload: Record<string, any>,
  id?: string,
): Promise<void> {
  const q = (supabase as any).from("workforce_channel_connections");
  const { error } = id ? await q.update(payload).eq("id", id) : await q.insert(payload);
  if (error) throw error;
}

export async function listWorkforceRoutingRules(): Promise<any[]> {
  const { data, error } = await (supabase as any)
    .from("workforce_routing_rules")
    .select("*")
    .order("event_topic");
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function upsertWorkforceRoutingRule(
  payload: Record<string, any>,
  id?: string,
): Promise<void> {
  const q = (supabase as any).from("workforce_routing_rules");
  const { error } = id ? await q.update(payload).eq("id", id) : await q.insert(payload);
  if (error) throw error;
}

// ─── Phase 10j.5h4: RPC wrappers ──────────────────────────────────────────
export async function getWorkforceDashboard(): Promise<any[]> {
  const { data, error } = await supabase.rpc("get_workforce_dashboard");
  if (error) throw error;
  return (data ?? []) as any[];
}

// ─── HR Targets (Phase 10i.3) ──────────────────────────────────────────────
export async function listHrTargets(): Promise<any[]> {
  const { data, error } = await (supabase as any)
    .from("hr_targets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listActiveWorkforceMembersWithName(): Promise<any[]> {
  const { data, error } = await (supabase as any)
    .from("workforce_members")
    .select("id, talents(full_name)")
    .eq("status", "active");
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function upsertHrTarget(payload: Record<string, any>): Promise<void> {
  if (payload?.id) {
    const { id, ...patch } = payload;
    const { error } = await (supabase as any).from("hr_targets").update(patch).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await (supabase as any).from("hr_targets").insert(payload);
    if (error) throw error;
  }
}

export async function deleteHrTarget(id: string): Promise<void> {
  const { error } = await (supabase as any).from("hr_targets").delete().eq("id", id);
  if (error) throw error;
}
