/**
 * Talent domain repository.
 * All raw `supabase.from(...)` access for talent admin surfaces flows through here.
 * Phase 10d — see .lovable/plan.md.
 */
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";

type ProfessionTable = "academies" | "schools" | "profession_categories";

export interface TalentPoolFilters {
  searchQuery?: string;
  countryFilter?: string;
  page: number;
  pageSize: number;
}

export async function getTalentRefCode(talentId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("talents")
    .select("ref_code")
    .eq("id", talentId)
    .single();
  if (error) throw error;
  return (data?.ref_code as string) ?? null;
}

export const talentRepo = {
  // ---------- Pool ----------
  listTalentsForPool: ({ searchQuery, countryFilter, page, pageSize }: TalentPoolFilters) => {
    let query = supabase
      .from("talents")
      .select(`*, outreach_count:outreach_messages(count)`, { count: "exact" })
      .order("updated_at", { ascending: false });
    if (searchQuery) {
      const safe = sanitizeIlike(searchQuery);
      if (safe) query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`);
    }
    if (countryFilter && countryFilter !== "all") query = query.eq("country", countryFilter);
    const from = (page - 1) * pageSize;
    return query.range(from, from + pageSize - 1);
  },

  // ---------- Notifications list ----------
  listNotificationsPage: (page: number, pageSize: number) => {
    const from = (page - 1) * pageSize;
    return supabase
      .from("notifications")
      .select(`*, talent:talents(full_name, email)`, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
  },

  // ---------- Outreach console ----------
  getOutreachChannel: () =>
    supabase
      .from("messaging_channels")
      .select("id, agent_key, status, daily_outreach_cap, hourly_outreach_cap")
      .eq("agent_key", "talent-outreach")
      .maybeSingle(),

  listOutreachableTalents: (search: string, limit = 50) => {
    let q = supabase
      .from("talents")
      .select(
        `id, full_name, phone, custom_profession, profession_categories(name)`,
      )
      .not("phone", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (search.trim()) q = q.ilike("full_name", `%${search.trim()}%`);
    return q;
  },

  // ---------- Portfolio requests list ----------
  listPortfolioRequests: (params: {
    page: number;
    pageSize: number;
    search?: string;
    statusFilter?: string;
  }) => {
    const { page, pageSize, search, statusFilter } = params;
    let query = supabase
      .from("portfolio_requests")
      .select(`*, profession_category:profession_categories(name)`, { count: "exact" })
      .order("created_at", { ascending: false });
    if (search) {
      const safe = sanitizeIlike(search);
      if (safe) query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`);
    }
    if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter as any);
    const from = (page - 1) * pageSize;
    return query.range(from, from + pageSize - 1);
  },


  listProfessionStructure: async () => {
    const [academies, schools, categories] = await Promise.all([
      supabase.from("academies").select("*").order("display_order"),
      supabase.from("schools").select("*").order("display_order"),
      supabase.from("profession_categories").select("*").order("display_order"),
    ]);
    return {
      academies: academies.data ?? [],
      schools: schools.data ?? [],
      professionLines: categories.data ?? [],
    };
  },

  upsertProfessionRow: async (
    table: ProfessionTable,
    payload: Record<string, any>,
    id?: string,
  ) => {
    const tbl = supabase.from(table) as any;
    return id ? tbl.update(payload).eq("id", id) : tbl.insert(payload);
  },

  listProfessionCategoriesLite: () =>
    supabase.from("profession_categories").select("id, name, slug, is_active").order("name"),

  listProfessionalRoles: () =>
    supabase
      .from("professional_roles")
      .select("id, profession_category_id, name, slug, display_order, is_active")
      .order("display_order")
      .order("name"),

  listTalentRoleAssignments: () =>
    supabase.from("talents").select("profession_category_id, professional_role_id").limit(5000),

  insertProfessionalRole: (payload: {
    profession_category_id: string;
    name: string;
    slug: string;
    display_order?: number;
    is_active?: boolean;
  }) => supabase.from("professional_roles").insert(payload),

  toggleProfessionalRole: (id: string, is_active: boolean) =>
    supabase.from("professional_roles").update({ is_active }).eq("id", id),

  deleteProfessionalRole: (id: string) =>
    supabase.from("professional_roles").delete().eq("id", id),

  // ---------- Pool / Outreach ----------
  logOutreachMessage: (row: {
    talent_id: string;
    product: string;
    channel: string;
    message_content?: string;
    notes?: string;
    agent_key?: string;
  }) =>
    supabase.from("outreach_messages").insert({
      sent_at: new Date().toISOString(),
      ...row,
    }),

  // ---------- Overview ----------
  countAishaConversations: async (
    filter?: (q: any) => any,
  ): Promise<number> => {
    let q: any = supabase.from("aisha_conversations").select("id", { head: true, count: "exact" });
    if (filter) q = filter(q);
    const { count } = await q;
    return count ?? 0;
  },

  // ---------- Creator Economy ----------
  countPostHypes: () =>
    supabase.from("post_hypes").select("id", { count: "exact", head: true }),

  listBoostedInboxes: (nowIso: string) =>
    supabase
      .from("talent_inbox_settings")
      .select("talent_id, boost_until, talents(full_name, profile_photo_url)")
      .gt("boost_until", nowIso),

  listTopAcceptedConnections: () =>
    supabase
      .from("talent_connections")
      .select(
        "recipient_talent_id, recipient_share, talents!talent_connections_recipient_talent_id_fkey(full_name)",
      )
      .eq("status", "accepted")
      .order("recipient_share", { ascending: false })
      .limit(10),

  // ---------- Portfolio Requests ----------
  updatePortfolioRequest: (id: string, updates: Record<string, any>) =>
    supabase.from("portfolio_requests").update(updates).eq("id", id),

  // ---------- Notifications ----------
  listProfessionCategoriesNames: () =>
    supabase.from("profession_categories").select("id, name"),

  listTalentsLite: (limit = 200) =>
    supabase.from("talents").select("id, full_name, email").order("full_name").limit(limit),

  // ---------- Batch / Importers ----------
  upsertTalentsBatch: (batch: any[]) =>
    supabase
      .from("talents")
      .upsert(batch, { onConflict: "phone", ignoreDuplicates: true }),

  getBatchUpload: (batchId: string) =>
    supabase.from("batch_uploads").select("*").eq("id", batchId).single(),

  logAgentMessage: (body: string) =>
    (supabase.from("messaging_messages") as any).insert({
      direction: "inbound",
      author: "Data Ingestion Agent",
      body,
      status: "delivered",
    }),

  // ---------- LinkedIn JSON importer ----------
  insertCompany: (insertObj: Record<string, any>) =>
    (supabase.from("companies") as any).insert(insertObj).select("id").single(),

  findCompanyByName: (name: string) =>
    supabase.from("companies").select("id").ilike("name", name).limit(1).single(),

  findExistingByEmails: (table: string, emails: string[]) =>
    (supabase.from(table as any) as any)
      .select("email, linkedin_url")
      .or(`email.in.(${emails.join(",")})`),

  insertIntoTable: (table: string, insertData: Record<string, any>) =>
    ((supabase as any).from(table)).insert(insertData),
};

// ─────────────────────────────────────────────────────────────────────────────
// Standalone helpers (Phase 10h.3)
// ─────────────────────────────────────────────────────────────────────────────

export async function findTalentIdsBySearch(search: string, limit = 200): Promise<string[]> {
  const safe = sanitizeIlike(search);
  if (!safe) return [];
  const { data, error } = await supabase
    .from("talents")
    .select("id")
    .or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`)
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((t: any) => t.id);
}

export async function findTalentByEmail(email: string): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("talents")
    .select("id")
    .ilike("email", email.trim())
    .maybeSingle();
  return (data as any) ?? null;
}

export async function getTalentJobPreferences(talentId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from("talents")
    .select("job_preferences")
    .eq("id", talentId)
    .single();
  if (error) throw error;
  return (data as any)?.job_preferences ?? null;
}

export async function updateTalentJobPreferences(
  talentId: string,
  preferences: any,
): Promise<void> {
  const { error } = await supabase
    .from("talents")
    .update({ job_preferences: preferences })
    .eq("id", talentId);
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// Phase 10j.1 — shared infra helpers
// -----------------------------------------------------------------------------

/** Lightweight registry ping used to warm up the PostgREST connection. */
export function pingProfessionCategories(signal?: AbortSignal) {
  let q = supabase.from("profession_categories").select("id").limit(1);
  if (signal) q = (q as any).abortSignal(signal);
  return q;
}

/** Email + display name lookup used by transactional email dispatch. */
export async function getTalentContact(talentId: string): Promise<{ email: string | null; full_name: string | null } | null> {
  const { data, error } = await supabase
    .from("talents")
    .select("email, full_name")
    .eq("id", talentId)
    .single();
  if (error) return null;
  return data as { email: string | null; full_name: string | null } | null;
}

/** Onboarding state fetched by auth user id (pre-auth stash finalization). */
export async function getTalentOnboardingStateByUser(userId: string) {
  const { data } = await supabase
    .from("talents")
    .select("country_id, career_stage_id, institution_id, institution, school_id, onboarding_completed_at")
    .eq("user_id", userId)
    .maybeSingle();
  return data as
    | {
        country_id: string | null;
        career_stage_id: string | null;
        institution_id: string | null;
        institution: string | null;
        school_id: string | null;
        onboarding_completed_at: string | null;
      }
    | null;
}

/** Patch talents row by auth user id (used by finalizePendingOnboarding). */
export async function patchTalentByUser(userId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from("talents").update(patch).eq("user_id", userId);
  if (error) throw error;
}


// ─── Phase 10j.2 — notifications + onboarding state ────────────────────────
export async function listNotifications(talentId: string, limit = 50) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string, timestamp: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ is_read: true, read_at: timestamp }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(talentId: string, timestamp: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: timestamp })
    .eq("talent_id", talentId)
    .eq("is_read", false);
  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
}

export async function updateTalentOnboardingStep(talentId: string, step: number): Promise<void> {
  const { error } = await supabase.from("talents").update({ onboarding_step: step }).eq("id", talentId);
  if (error) throw error;
}

export async function getTalentCreditExistence(talentId: string): Promise<boolean> {
  const { data } = await supabase
    .from("talent_credits")
    .select("id")
    .eq("talent_id", talentId)
    .maybeSingle();
  return !!data;
}

export async function getTalentDuplicateState(
  talentId: string,
): Promise<{ is_suspected_duplicate: boolean | null; cv_fingerprint: string | null } | null> {
  const { data, error } = await supabase
    .from("talents")
    .select("is_suspected_duplicate, cv_fingerprint")
    .eq("id", talentId)
    .maybeSingle();
  if (error) throw error;
  return (data as any) ?? null;
}

export async function completeTalentOnboarding(talentId: string): Promise<void> {
  const { error } = await supabase
    .from("talents")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      onboarding_step: 4,
    })
    .eq("id", talentId);
  if (error) throw error;
}

export async function deleteAiRecommendationsForTalent(talentId: string): Promise<void> {
  await supabase.from("ai_recommendations").delete().eq("talent_id", talentId);
}

/* ---------------- Phase 10j.3: shared component helpers ---------------- */

export async function getTalentRowByUserId(userId: string) {
  const { data, error } = await supabase
    .from("talents")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as any | null;
}

export async function updateTalentById(id: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from("talents").update(patch).eq("id", id);
  if (error) throw error;
}

export async function getTalentReferralIdentityByUser(
  userId: string,
): Promise<{ id: string; ref_code: string | null } | null> {
  const { data, error } = await supabase
    .from("talents")
    .select("id, ref_code")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as any) ?? null;
}

export async function countTalentsReferredBy(referrerTalentId: string): Promise<number> {
  const { count, error } = await supabase
    .from("talents")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", referrerTalentId);
  if (error) throw error;
  return count ?? 0;
}

export async function getTalentInboxVolume(talentId: string): Promise<number> {
  const { data, error } = await supabase
    .from("v_talent_transaction_volume" as any)
    .select("volume")
    .eq("talent_id", talentId)
    .maybeSingle();
  if (error) throw error;
  return Number((data as any)?.volume ?? 0);
}

export async function getTalentInboxUnlocked(talentId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("talent_inbox_settings")
    .select("unlocked")
    .eq("talent_id", talentId)
    .maybeSingle();
  if (error) throw error;
  return Boolean((data as any)?.unlocked);
}

export async function getTalentCareerCoachInstructorId(talentId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("talents")
    .select("career_coach_instructor_id")
    .eq("id", talentId)
    .maybeSingle();
  if (error) throw error;
  return ((data as any)?.career_coach_instructor_id as string | null) ?? null;
}

// -----------------------------------------------------------------------------
// Phase 10j.3b additions
// -----------------------------------------------------------------------------

export async function findTalentByPhoneExceptId(phone: string, excludeId: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("talents")
    .select("id")
    .eq("phone", phone)
    .neq("id", excludeId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function resolveTalentEmailByPhoneVariants(variants: string[]): Promise<string | null> {
  const matchQuery = variants.map((p) => `phone.eq.${p}`).join(",");
  const { data, error } = await supabase
    .from("talents")
    .select("email")
    .or(matchQuery)
    .not("email", "is", null)
    .limit(2);
  if (error || !data || data.length === 0) return null;
  if (data.length > 1) {
    throw new Error("Multiple accounts found for this phone. Please sign in with email.");
  }
  return (data[0] as any).email as string | null;
}

export async function getTalentLifetimeCredits(talentId: string) {
  const { data, error } = await supabase
    .from("talent_lifetime_credits" as any)
    .select("lifetime_volume, lifetime_earned, lifetime_spent, transaction_count")
    .eq("talent_id", talentId)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function listNotificationPreferences(talentId: string) {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("channel, enabled")
    .eq("talent_id", talentId);
  if (error) throw error;
  return (data ?? []) as Array<{ channel: string; enabled: boolean }>;
}

export async function upsertNotificationPreference(talentId: string, channel: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ talent_id: talentId, channel, enabled }, { onConflict: "talent_id,channel" });
  if (error) throw error;
}

export async function listSavedItemsByTalent(talentId: string) {
  const { data, error } = await supabase
    .from("saved_items")
    .select("id, item_id, item_type, saved_at")
    .eq("talent_id", talentId)
    .order("saved_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; item_id: string; item_type: string; saved_at: string }>;
}

export async function deleteSavedItemRow(talentId: string, itemId: string, itemType: string): Promise<void> {
  const { error } = await supabase
    .from("saved_items")
    .delete()
    .eq("talent_id", talentId)
    .eq("item_id", itemId)
    .eq("item_type", itemType);
  if (error) throw error;
}

export async function insertSavedItemRow(talentId: string, itemId: string, itemType: string) {
  const { data, error } = await supabase
    .from("saved_items")
    .insert({ talent_id: talentId, item_id: itemId, item_type: itemType })
    .select("id, item_id, item_type, saved_at")
    .single();
  if (error) throw error;
  return data as { id: string; item_id: string; item_type: string; saved_at: string };
}

export async function getTalentUserIdById(talentId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("talents")
    .select("user_id")
    .eq("id", talentId)
    .maybeSingle();
  if (error) throw error;
  return (data as any)?.user_id ?? null;
}

export async function listTalentNamesByIds(ids: string[]): Promise<Array<{ id: string; full_name: string | null }>> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("talents")
    .select("id, full_name")
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as any[];
}
