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

// ─── Phase 10j.5k12 — talent abroad/IELTS/language reads ─────────────────
export async function listActiveStudyAbroadPrograms(args: {
  country?: string;
  degree?: string;
  search?: string;
}) {
  let query = supabase
    .from("study_abroad_programs")
    .select("*")
    .eq("is_active", true)
    .order("featured", { ascending: false })
    .order("university_name");
  if (args.country && args.country !== "all") query = query.eq("country_code", args.country);
  if (args.degree && args.degree !== "All Degrees") query = query.eq("degree_type", args.degree);
  if (args.search) {
    query = query.or(
      `university_name.ilike.%${args.search}%,program_name.ilike.%${args.search}%`,
    );
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listActiveDestinationAgents() {
  const { data, error } = await supabase
    .from("destination_agents")
    .select("id, country_code, display_name, tagline, flag_emoji, is_active, display_order")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function getDestinationAgentByCountry(countryCode: string) {
  const { data, error } = await supabase
    .from("destination_agents")
    .select("id, country_code, display_name, tagline, flag_emoji")
    .eq("country_code", countryCode)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function listActiveProgramsForCountry(countryCode: string, limit = 10) {
  const { data, error } = await supabase
    .from("study_abroad_programs")
    .select("id, university_name, program_name, degree_type, tuition_range")
    .eq("country_code", countryCode)
    .eq("is_active", true)
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listDestinationAgentMessages(countryCode: string, limit = 40) {
  const { data, error } = await supabase
    .from("destination_agent_messages")
    .select("role, content")
    .eq("country_code", countryCode)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function getIeltsStreakByUser(userId: string) {
  const { data, error } = await supabase
    .from("ielts_streaks")
    .select("id, user_id, current_streak_days, longest_streak_days, xp_total, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function listRecentIeltsMockAttempts(limit = 5) {
  const { data, error } = await supabase
    .from("ielts_mock_attempts")
    .select("id, section, ai_band_score, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function getIeltsDailyChallenge(dateStr: string) {
  const { data, error } = await supabase
    .from("ielts_daily_challenges")
    .select("id, challenge_date, section, prompt_id, ielts_prompts(id, prompt_text)")
    .eq("challenge_date", dateStr)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function listIeltsResourceAccessByTalent(talentId: string): Promise<string[]> {
  const { data } = await supabase
    .from("ielts_resource_access")
    .select("resource_id")
    .eq("talent_id", talentId);
  return ((data ?? []) as any[]).map((r) => r.resource_id);
}

export async function listActiveIeltsResourcesBySection(section: string) {
  const { data, error } = await supabase
    .from("ielts_resources")
    .select("id, title, description, section, content_type, content_url, is_free, duration_mins, difficulty_level")
    .eq("section", section)
    .eq("is_active", true)
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listActiveLanguageInstructorsByCode(languageCode: string) {
  const { data, error } = await supabase
    .from("language_instructors")
    .select("id, user_id, display_name, native_language, is_verified, hourly_rate_credits, bio")
    .contains("teaches_languages", [languageCode.toUpperCase()])
    .eq("is_active", true)
    .order("rating", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listAbroadApplicationsForCurrentUser() {
  const { data, error } = await supabase
    .from("abroad_applications")
    .select("id, target_country, intake_term, stage, updated_at, created_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

