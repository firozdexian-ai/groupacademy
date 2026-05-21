/**
 * Companies domain repository (Phase 10f).
 *
 * The single sanctioned caller of `supabase.from(...)` for companies-owned
 * tables (companies, contacts, contact_outreach, company_agents,
 * company_agent_leads, ai_agents [admin views], talent_contact_unlocks,
 * followed_companies).
 *
 * Rules:
 * - Named-export functions only; no React, no hooks here.
 * - Throws on error; callers handle via try/catch.
 * - Storage and edge-function calls stay in callers.
 */
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";

// ---------- Companies ----------

export interface ListCompaniesPagedParams {
  search?: string;
  industry?: string; // "all" | "none" | specific value
  from: number;
  to: number;
}

export async function listCompaniesPaged(params: ListCompaniesPagedParams) {
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
  return { rows: (data ?? []) as any[], count: count ?? 0 };
}

export async function listCompaniesNameSorted(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase.from("companies").select("id, name").order("name");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string }>;
}

export async function listCompaniesForAgentPicker(): Promise<any[]> {
  const { data, error } = await supabase.from("companies").select("id, name, logo_url, industry").order("name");
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function upsertCompany(payload: any): Promise<void> {
  const { error } = await supabase.from("companies").upsert(payload);
  if (error) throw error;
}

export async function insertCompany(payload: any): Promise<{ id: string }> {
  const { data, error } = await supabase.from("companies").insert(payload).select("id").single();
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

// ---------- Contacts ----------

export interface ListContactsPagedParams {
  from: number;
  to: number;
}

export async function listContactsPaged(params: ListContactsPagedParams) {
  const { data, error, count } = await supabase
    .from("contacts")
    .select("*, company:companies(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(params.from, params.to);
  if (error) throw error;
  return { rows: (data ?? []) as any[], count: count ?? 0 };
}

export async function upsertContact(payload: any): Promise<void> {
  const { error } = await supabase.from("contacts").upsert(payload);
  if (error) throw error;
}

export async function insertContact(payload: any): Promise<void> {
  const { error } = await supabase.from("contacts").insert(payload);
  if (error) throw error;
}

export async function listAllContactIdentifiers(): Promise<Array<{ id: string; email: string | null; phone: string | null }>> {
  const { data, error } = await supabase.from("contacts").select("id, email, phone");
  if (error) throw error;
  return (data ?? []) as any;
}

// ---------- Contact outreach ----------

export async function listLatestOutreachForCompanies(companyIds: string[]) {
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

// ---------- AI agents (admin Company Agents view) ----------

export async function listCompanyAgentsFull(): Promise<any[]> {
  const { data, error } = await supabase
    .from("company_agents")
    .select(
      `
      *,
      ai_agents (*),
      companies (id, name, logo_url, industry)
    `,
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listCompanyAgentLeads(): Promise<any[]> {
  const { data, error } = await supabase
    .from("company_agent_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
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

// ---------- Contact unlocks ----------

export async function listRecentContactUnlocks(limit = 500): Promise<any[]> {
  const { data, error } = await supabase
    .from("talent_contact_unlocks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listTalentEmailsByUserIds(userIds: string[]) {
  if (!userIds.length) return [];
  const { data, error } = await supabase.from("talents").select("user_id, email").in("user_id", userIds);
  if (error) throw error;
  return (data ?? []) as Array<{ user_id: string; email: string | null }>;
}

// ---------- Followed companies ----------

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
