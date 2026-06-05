/**
 * Companies domain repository (Phase 10f).
 *
 * The single sanctioned caller of `supabase.from(...)` for companies-owned
 * tables (companies, contacts, contact_outreach, company_agents,
 * company_agent_leads, ai_agents [admin views], talent_contact_unlocks,
 * followed_companies, company_members, company_post_drafts, company_leads,
 * company_lead_activities, company_offerings, company_talent_shortlists).
 *
 * Rules:
 * - Named-export functions only; no React, no hooks here.
 * - Throws on error; callers handle via try/catch.
 * - Storage and edge-function calls stay in callers.
 */
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";

// ---------- Strong Operational Type Declarations ----------

export interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  about: string | null;
  logo_url: string | null;
  banner_url: string | null;
  website: string | null;
  industry: string | null;
  primary_email: string | null;
  country: string | null;
  profile_completion: number;
  verification_tier: string;
  goals: string[] | null;
  created_at: string;
}

export interface ContactRow {
  id: string;
  company_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  [key: string]: any;
  company?: { name: string | null };
}

export interface ListCompaniesPagedParams {
  search?: string;
  industry?: string; // "all" | "none" | specific value
  from: number;
  to: number;
}

export interface ListContactsPagedParams {
  from: number;
  to: number;
}

export interface CompanyCreditTxnRow {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  service_type: string | null;
  description: string | null;
  created_at: string;
}

export interface ContactUnlocksSummary {
  total_unlocks: number;
  total_credits: number;
  last_7d: number;
}

// ---------- Companies Core Matrix ----------

export async function listCompaniesPaged(params: ListCompaniesPagedParams): Promise<{ rows: CompanyRow[]; count: number }> {
  let query = supabase.from("companies").select("*", { count: "exact" }).order("name");
  
  if (params.search) {
    const safe = sanitizeIlike(params.search);
    query = query.or(`name.ilike.%${safe}%,industry.ilike.%${safe}%,primary_email.ilike.%${safe}%`);
  }
  
  if (params.industry && params.industry !== "all") {
    query = params.industry === "none" ? query.is("industry", null) : query.eq("industry", params.industry);
  }
  
  const { data, error, count } = await query.range(params.from, params.to);
  if (error) throw error;
  
  return { rows: (data ?? []) as CompanyRow[], count: count ?? 0 };
}

export async function listCompaniesNameSorted(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase.from("companies").select("id, name").order("name");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string }>;
}

export async function listCompaniesForAgentPicker(): Promise<Array<{ id: string; name: string; logo_url: string | null; industry: string | null }>> {
  const { data, error } = await supabase.from("companies").select("id, name, logo_url, industry").order("name");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string; logo_url: string | null; industry: string | null }>;
}

export async function upsertCompany(payload: Record<string, any> & { name: string }): Promise<void> {
  const { error } = await supabase.from("companies").upsert(payload as any);
  if (error) throw error;
}

export async function insertCompany(payload: Record<string, any> & { name: string }): Promise<{ id: string }> {
  const { data, error } = await supabase.from("companies").insert(payload as any).select("id").single();
  if (error) throw error;
  return data as { id: string };
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
}

export async function listAllCompanyNames(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase.from("companies").select("id, name");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string }>;
}

export async function listCompaniesByIds(ids: string[]): Promise<Array<{ id: string; name: string }>> {
  if (!ids.length) return [];
  const { data, error } = await supabase.from("companies").select("id, name").in("id", ids);
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string }>;
}

/** Look up existing company rows by exact name (case-sensitive at the DB level). */
export async function listCompaniesByNames(names: string[]): Promise<Array<{ id: string; name: string }>> {
  if (!names.length) return [];
  const { data, error } = await supabase.from("companies").select("id, name").in("name", names);
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string }>;
}

/** Bulk insert minimal company rows; returns id+name for cache mapping. */
export async function insertCompaniesBulk(
  payloads: Array<Record<string, any> & { name: string }>,
): Promise<Array<{ id: string; name: string }>> {
  if (!payloads.length) return [];
  const { data, error } = await supabase
    .from("companies")
    .insert(payloads as any)
    .select("id, name");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string }>;
}


export async function countCompaniesWithNullIndustry(): Promise<number> {
  const { count, error } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true })
    .is("industry", null);
  if (error) throw error;
  return count ?? 0;
}

export async function renameCompanyIndustry(fromName: string, toName: string): Promise<void> {
  const { error } = await supabase.from("companies").update({ industry: toName }).eq("industry", fromName);
  if (error) throw error;
}

// ---------- Contacts Core Matrix ----------

export async function listContactsPaged(params: ListContactsPagedParams): Promise<{ rows: ContactRow[]; count: number }> {
  const { data, error, count } = await supabase
    .from("contacts")
    .select("*, company:companies(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(params.from, params.to);
  if (error) throw error;
  return { rows: (data ?? []) as ContactRow[], count: count ?? 0 };
}

export async function upsertContact(payload: Record<string, any> & { email: string }): Promise<void> {
  const { error } = await supabase.from("contacts").upsert(payload as any);
  if (error) throw error;
}

export async function insertContact(payload: Record<string, any>): Promise<void> {
  const { error } = await supabase.from("contacts").insert(payload as any);
  if (error) throw error;
}

export async function listAllContactIdentifiers(): Promise<Array<{ id: string; email: string | null; phone: string | null }>> {
  const { data, error } = await supabase.from("contacts").select("id, email, phone");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; email: string | null; phone: string | null }>;
}

// ---------- Contact Outreach Tracking ----------

export async function listLatestOutreachForCompanies(companyIds: string[]): Promise<Array<{ company_id: string; sent_at: string; message_type: string }>> {
  if (!companyIds.length) return [];
  const { data, error } = await supabase
    .from("contact_outreach")
    .select("company_id, sent_at, message_type")
    .in("company_id", companyIds)
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<{ company_id: string; sent_at: string; message_type: string }>;
}

export async function logContactOutreach(payload: {
  company_id: string;
  channel: string;
  message_type: string;
  sent_by: string;
}): Promise<void> {
  const { error } = await supabase.from("contact_outreach").insert(payload);
  if (error) throw error;
}

// ---------- AI Operational Agents Swarm View ----------

export async function listCompanyAgentsFull(): Promise<any[]> {
  const { data, error } = await supabase
    .from("company_agents")
    .select(`
      *,
      ai_agents (*),
      companies (id, name, logo_url, industry)
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listCompanyAgentLeads(): Promise<any[]> {
  const { data, error } = await supabase
    .from("company_agent_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertAiAgent(payload: any): Promise<{ id: string }> {
  const { data, error } = await supabase.from("ai_agents").insert(payload).select().single();
  if (error) throw error;
  return data as { id: string };
}

export async function insertCompanyAgent(payload: any): Promise<void> {
  const { error } = await supabase.from("company_agents").insert(payload);
  if (error) throw error;
}

export async function updateAiAgentActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("ai_agents").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

export async function updateCompanyAgentActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("company_agents").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

export async function deleteAiAgent(id: string): Promise<void> {
  const { error } = await supabase.from("ai_agents").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteCompanyAgentById(id: string): Promise<void> {
  const { error } = await supabase.from("company_agents").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Talent Information Access Unlocks ----------

export async function listRecentContactUnlocks(limit = 500): Promise<any[]> {
  const { data, error } = await supabase
    .from("talent_contact_unlocks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listTalentEmailsByUserIds(userIds: string[]): Promise<Array<{ user_id: string; email: string | null }>> {
  if (!userIds.length) return [];
  const { data, error } = await supabase.from("talents").select("user_id, email").in("user_id", userIds);
  if (error) throw error;
  return (data ?? []) as Array<{ user_id: string; email: string | null }>;
}

// ---------- Followed Companies Registry ----------

export async function listFollowedCompanyNames(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("followed_companies")
    .select("company_name")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.company_name);
}

export async function followCompany(userId: string, companyName: string): Promise<void> {
  const { error } = await supabase
    .from("followed_companies")
    .insert({ user_id: userId, company_name: companyName });
  if (error) throw error;
}

export async function unfollowCompany(userId: string, companyName: string): Promise<void> {
  const { error } = await supabase
    .from("followed_companies")
    .delete()
    .eq("user_id", userId)
    .eq("company_name", companyName);
  if (error) throw error;
}

// ---------- Active Workspace Memberships & Rules ----------

export async function getActiveCompanyMembership(userId: string): Promise<{ company_id: string; role: string | null } | null> {
  const { data, error } = await supabase
    .from("company_members")
    .select("company_id, role")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getActiveAdminCompanyMembership(userId: string): Promise<{ company_id: string; role: string } | null> {
  const { data, error } = await supabase
    .from("company_members")
    .select("company_id, role")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", ["owner", "admin"])
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as { company_id: string; role: string } | null;
}

export async function getActiveCompanyMembershipWithName(userId: string): Promise<{ company_id: string; role: string; companies: { name: string | null } | null } | null> {
  const { data, error } = await supabase
    .from("company_members")
    .select("company_id, role, companies:company_id (name)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

// ---------- Gro10x B2B Product Infrastructure Interfaces ----------

export async function listPendingCompanyPostDrafts(companyId: string, limit = 10): Promise<any[]> {
  const { data, error } = await supabase
    .from("company_post_drafts")
    .select("id, text_content, tags, agent_key, created_at")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listCompanyLeads(companyId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("company_leads")
    .select("id, name, email, phone, company_name, title, source, stage, value_usd, notes, next_step, offering_id, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertCompanyLead(payload: Record<string, any>): Promise<void> {
  const { error } = await supabase.from("company_leads").insert(payload as any);
  if (error) throw error;
}

export async function updateCompanyLead(id: string, patch: Record<string, any>): Promise<void> {
  const { error } = await supabase.from("company_leads").update(patch).eq("id", id);
  if (error) throw error;
}

export async function listCompanyLeadActivities(leadId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("company_lead_activities")
    .select("id, activity_type, body, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertCompanyLeadActivity(payload: Record<string, any>): Promise<void> {
  const { error } = await supabase.from("company_lead_activities").insert(payload as any);
  if (error) throw error;
}

export async function listCompanyOfferings(companyId: string, activeOnly = false): Promise<any[]> {
  let q = supabase
    .from("company_offerings")
    .select("*")
    .eq("company_id", companyId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
    
  if (activeOnly) q = q.eq("is_active", true);
  
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function upsertCompanyOffering(payload: Record<string, any> & { id?: string }): Promise<void> {
  if (payload.id) {
    const { error } = await supabase.from("company_offerings").update(payload).eq("id", payload.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("company_offerings").insert(payload as any);
    if (error) throw error;
  }
}

export async function deleteCompanyOffering(id: string): Promise<void> {
  const { error } = await supabase.from("company_offerings").delete().eq("id", id);
  if (error) throw error;
}

export async function listAllCompaniesWithSlug(): Promise<Array<{ id: string; name: string; slug: string }>> {
  const { data, error } = await supabase.from("companies").select("id, name, slug").order("name");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string; slug: string }>;
}

export async function getActiveCompanyIdForUser(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.company_id ?? null;
}

export async function getCompanyGoals(companyId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("goals")
    .eq("id", companyId)
    .maybeSingle();
  if (error) throw error;
  return (data?.goals as string[]) ?? [];
}

export async function getCompanyCreditPools(companyId: string): Promise<{ balance: number; earnedBalance: number }> {
  const { data, error } = await supabase
    .from("company_credits")
    .select("balance, earned_balance")
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) throw error;
  return {
    balance: Number(data?.balance ?? 0),
    earnedBalance: Number(data?.earned_balance ?? 0),
  };
}

export async function listCompanyCreditTransactionsSince(companyId: string, sinceIso: string, limit = 200): Promise<CompanyCreditTxnRow[]> {
  const { data, error } = await supabase
    .from("company_credit_transactions")
    .select("id, amount, balance_after, transaction_type, service_type, description, created_at")
    .eq("company_id", companyId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  
  return (data ?? []).map((r: any) => ({
    ...r,
    amount: Number(r.amount),
    balance_after: Number(r.balance_after),
  })) as CompanyCreditTxnRow[];
}

export async function getCompanyMemberRole(userId: string, companyId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("company_members")
    .select("role")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return data?.role ?? null;
}

export async function getCompanyPublicProfile(companyId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, tagline, about, logo_url, banner_url, website, country, slug, profile_completion, verification_tier")
    .eq("id", companyId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function listActiveCompanyMembers(companyId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("company_members")
    .select("user_id, role, status, invited_email")
    .eq("company_id", companyId)
    .eq("status", "active");
  if (error) throw error;
  return data ?? [];
}

export async function updateCompanyField(companyId: string, patch: Record<string, any>): Promise<{ error: any }> {
  const { error } = await supabase.from("companies").update(patch).eq("id", companyId);
  return { error };
}

export async function getCompanyPublicProfileBySlug(slug: string): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, tagline, about, logo_url, banner_url, website, country, slug")
    .eq("slug", slug)
    .maybeSingle();
  return { data, error };
}

export async function listActiveCompanyMemberUserIds(companyId: string, limit = 12): Promise<string[]> {
  const { data, error } = await supabase
    .from("company_members")
    .select("user_id")
    .eq("company_id", companyId)
    .eq("status", "active")
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => r.user_id).filter(Boolean);
}

export async function listCompanyShortlistsRecent(companyId: string, limit = 200): Promise<Array<{ talent_id: string; created_at: string }>> {
  const { data, error } = await supabase
    .from("company_talent_shortlists")
    .select("talent_id, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Array<{ talent_id: string; created_at: string }>;
}

export async function getCompanyNameAndLogo(companyId: string): Promise<{ name: string | null; logo_url: string | null } | null> {
  const { data, error } = await supabase
    .from("companies")
    .select("name, logo_url")
    .eq("id", companyId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getActiveMembershipWithCompanyName(userId: string): Promise<{ role: string; companies: { name: string } | null } | null> {
  const { data, error } = await supabase
    .from("company_members")
    .select("role, companies:company_id (name)")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as { role: string; companies: { name: string } | null } | null;
}

// ---------- High-Performance Stored Procedures (RPC) Wrappers ----------

export async function getCompaniesOverview(): Promise<any> {
  const { data, error } = await supabase.rpc("get_companies_overview");
  if (error) throw error;
  return data;
}

export async function getIndustryRollup(): Promise<any[]> {
  const { data, error } = await supabase.rpc("get_industry_rollup");
  if (error) throw error;
  return data ?? [];
}

export async function mergeIndustries(sources: string[], target: string): Promise<void> {
  const { error } = await supabase.rpc("merge_industries", { p_sources: sources, p_target: target });
  if (error) throw error;
}

export async function getContactUnlocksSummary(): Promise<ContactUnlocksSummary> {
  const { data, error } = await supabase.rpc("get_contact_unlocks_summary");
  if (error) throw error;
  return (data ?? { total_unlocks: 0, total_credits: 0, last_7d: 0 }) as unknown as ContactUnlocksSummary;
}

export async function getCompanyDetail<T = any>(companyName: string): Promise<T> {
  const { data, error } = await supabase.rpc("get_company_detail", { p_company_name: companyName });
  if (error) throw error;
  return data as T;
}

export async function getCompaniesWithSignal<T = any>(args: { country?: string | null; limit: number }): Promise<T> {
  const { data, error } = await supabase.rpc("get_companies_with_signal", {
    p_country: args.country ?? null,
    p_limit: args.limit,
  });
  if (error) throw error;
  return data as T;
}