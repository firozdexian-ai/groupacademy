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
