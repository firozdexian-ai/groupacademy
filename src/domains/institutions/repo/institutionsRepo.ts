/**
 * Institutions domain repository (Phase 10i.2).
 */
import { supabase } from "@/integrations/supabase/client";

// ─── Generic helpers ───────────────────────────────────────────────────────
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

// ─── Institution types taxonomy ────────────────────────────────────────────
export async function listInstitutionTypes(): Promise<any[]> {
  const { data, error } = await supabase
    .from("institution_types")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ─── Institutions overview ────────────────────────────────────────────────
export async function getInstitutionsOverviewStats() {
  const [institutions, talents, programs, events] = await Promise.all([
    supabase.from("institutions").select("*", { count: "exact", head: true }),
    supabase
      .from("talents")
      .select("*", { count: "exact", head: true })
      .not("institution_id", "is", null),
    supabase
      .from("study_abroad_programs")
      .select("*", { count: "exact", head: true })
      .not("institution_id", "is", null),
    supabase
      .from("competitions")
      .select("*", { count: "exact", head: true })
      .not("institution_id", "is", null),
  ]);
  return {
    totalInstitutions: institutions.count || 0,
    connectedTalents: talents.count || 0,
    linkedPrograms: programs.count || 0,
    hostedEvents: events.count || 0,
  };
}

// ─── Stakeholder Registry (institutions / partner_organizations) ──────────
export async function listStakeholders(table: "institutions" | "partner_organizations"): Promise<any[]> {
  const { data, error } = await supabase
    .from(table as any)
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as any[];
}

// ─── Institution Child Registry helpers ───────────────────────────────────
export async function listInstitutionsMin(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase.from("institutions").select("id,name").order("name");
  if (error) throw error;
  return (data ?? []) as any;
}

export async function listInstitutionClubsByInstitution(institutionId: string): Promise<Array<{ id: string; name: string }>> {
  const { data } = await supabase
    .from("institution_clubs")
    .select("id, name")
    .eq("institution_id", institutionId);
  return (data ?? []) as any;
}

export interface ListInstitutionChildOpts {
  table: "institution_clubs" | "institution_representatives" | "institution_events";
  instFilter: string; // "all" or institution_id
  eventTab: "upcoming" | "past";
}

export async function listInstitutionChildRows(opts: ListInstitutionChildOpts): Promise<any[]> {
  let query = supabase.from(opts.table as any).select("*");
  if (opts.instFilter !== "all") query = query.eq("institution_id", opts.instFilter);

  if (opts.table === "institution_events") {
    const now = new Date().toISOString();
    query =
      opts.eventTab === "upcoming"
        ? query.gte("starts_at", now).order("starts_at", { ascending: true })
        : query.lt("starts_at", now).order("starts_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as any[];
}
