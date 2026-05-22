/**
 * Abroad domain repository (Phase 10i.2).
 */
import { supabase } from "@/integrations/supabase/client";

// ─── Generic graph helpers ────────────────────────────────────────────────
export async function upsertGraphRow(table: string, payload: any): Promise<void> {
  if (payload?.id) {
    const { id, ...patch } = payload;
    const { error } = await supabase.from(table as any).update(patch).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from(table as any).insert(payload);
    if (error) throw error;
  }
}

export async function deleteGraphRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table as any).delete().eq("id", id);
  if (error) throw error;
}

// ─── Abroad master graph ──────────────────────────────────────────────────
export async function getAbroadGraphMaster() {
  const [appsRes, programsRes, roadmapsRes, agentsRes, ieltsRes, resourcesRes] = await Promise.all([
    supabase
      .from("abroad_applications")
      .select("id, talent_user_id, program_id, stage, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("study_abroad_programs")
      .select("id, program_name, university_name, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("study_abroad_roadmaps")
      .select("id, talent_id, target_countries, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("destination_agents")
      .select("id, display_name, country_code, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("ielts_mock_attempts")
      .select("id, user_id, prompt_id, ai_band_score, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("ielts_resources")
      .select("id, title, content_type, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (appsRes.error) throw appsRes.error;
  if (programsRes.error) throw programsRes.error;
  if (roadmapsRes.error) throw roadmapsRes.error;
  if (agentsRes.error) throw agentsRes.error;
  if (ieltsRes.error) throw ieltsRes.error;
  if (resourcesRes.error) throw resourcesRes.error;
  return {
    apps: appsRes.data ?? [],
    programs: programsRes.data ?? [],
    roadmaps: roadmapsRes.data ?? [],
    agents: agentsRes.data ?? [],
    ielts: ieltsRes.data ?? [],
    resources: resourcesRes.data ?? [],
  };
}

// ─── Roadmap intake (talent-facing) ───────────────────────────────────────
export async function insertRoadmapContactLead(payload: Record<string, any>): Promise<{ error: any | null }> {
  const { error } = await (supabase.from("contacts") as any).insert([payload]);
  return { error };
}

export async function insertStudyAbroadRoadmap(payload: Record<string, any>): Promise<{ id: string }> {
  const { data, error } = await (supabase.from("study_abroad_roadmaps") as any)
    .insert([payload])
    .select("id")
    .single();
  if (error) throw error;
  return { id: (data as any).id };
}

// ─── Phase 10j.5d additions ────────────────────────────────────────────────
export async function getActiveCounsellorByUser(userId: string): Promise<{ user_id: string } | null> {
  const { data } = await supabase
    .from("abroad_counsellors")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function listAbroadApplications() {
  const { data, error } = await supabase
    .from("abroad_applications")
    .select("id, target_country, intake_term, stage, updated_at, created_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function getStudyAbroadProgramById(id: string) {
  const { data, error } = await supabase
    .from("study_abroad_programs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function getStudyAbroadRoadmapById(id: string) {
  const { data, error } = await supabase
    .from("study_abroad_roadmaps")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function getSchoolBySlugWithAcademy(slug: string) {
  const { data, error } = await supabase
    .from("schools")
    .select("*, academies(name, slug)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function listProfessionCategoriesForSchool(schoolId: string) {
  const { data, error } = await supabase
    .from("profession_categories")
    .select("*, ai_instructors(id, name)")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function insertInstructorConnectionRequest(payload: {
  talent_id: string;
  school_id: string;
  profession_id: string;
  instructor_id: string | null;
  message: string | null;
}): Promise<{ error: any }> {
  const { error } = await supabase.from("instructor_connection_requests").insert(payload as any);
  return { error };
}

// ─── Phase 10j.5h9 ────────────────────────────────────────────────────────


export async function advanceAbroadStage(args: { applicationId: string; nextStage: string }): Promise<void> {
  const { error } = await supabase.rpc("advance_abroad_stage", {
    _application_id: args.applicationId,
    _next_stage: args.nextStage,
  });
  if (error) throw error;
}
