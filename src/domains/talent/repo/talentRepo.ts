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


  // ---------- Professions / Roles ----------
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

  insertIntoTable: (table: string, insertData: Record<string, any>) =>
    ((supabase as any).from(table)).insert(insertData),
};
