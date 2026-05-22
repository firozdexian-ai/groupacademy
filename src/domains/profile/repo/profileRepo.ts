/**
 * GroUp Academy — Profile Domain Repository (Phase 10e)
 * Sole owner of `supabase.from(...)` table I/O for the profile domain.
 * Storage (`supabase.storage.from(...)`) and RPC paths intentionally remain in their callers.
 */
import { supabase } from "@/integrations/supabase/client";
import type { PublicProfileSettings } from "@/domains/profile/hooks/usePublicProfileSettings";
import type { TalentRelStage } from "@/domains/profile/hooks/useTalentRelationships";

// -----------------------------------------------------------------------------
// Public profile settings (talents row partial)
// -----------------------------------------------------------------------------

export async function getPublicProfileSettings(talentId: string) {
  const { data, error } = await supabase
    .from("talents")
    .select("public_handle, public_profile_enabled, public_show_mastery, public_show_credentials, public_bio")
    .eq("id", talentId)
    .maybeSingle();
  if (error) throw error;
  return data as PublicProfileSettings | null;
}

export async function updatePublicProfileSettings(talentId: string, patch: Partial<PublicProfileSettings>) {
  const { error } = await supabase.from("talents").update(patch).eq("id", talentId);
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// Talent lists & members
// -----------------------------------------------------------------------------

export async function listTalentLists(companyId: string) {
  const { data, error } = await supabase
    .from("talent_lists")
    .select("*, talent_list_members(count)")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listTalentListMembers(listId: string) {
  const { data, error } = await supabase
    .from("talent_list_members")
    .select("*, talents(id, full_name, profile_photo_url, custom_profession, country, public_handle)")
    .eq("list_id", listId)
    .order("added_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function createTalentList(input: {
  companyId: string;
  name: string;
  description?: string | null;
  createdBy: string;
}) {
  const { data, error } = await supabase
    .from("talent_lists")
    .insert({
      company_id: input.companyId,
      name: input.name,
      description: input.description ?? null,
      created_by: input.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertTalentListMember(input: {
  listId: string;
  talentId: string;
  addedBy: string;
  note?: string | null;
}) {
  const { error } = await supabase.from("talent_list_members").upsert(
    {
      list_id: input.listId,
      talent_id: input.talentId,
      added_by: input.addedBy,
      note: input.note ?? null,
    },
    { onConflict: "list_id,talent_id" },
  );
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// Talent relationships (employer CRM pipeline)
// -----------------------------------------------------------------------------

export async function listTalentRelationships(companyId: string) {
  const { data, error } = await supabase
    .from("talent_relationships")
    .select("*, talent:talents(id, full_name, profile_photo_url, custom_profession, public_handle)")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function upsertTalentRelationship(input: {
  companyId: string;
  talentId: string;
  stage?: TalentRelStage;
  source?: string;
}) {
  const { data, error } = await supabase
    .from("talent_relationships")
    .upsert(
      {
        company_id: input.companyId,
        talent_id: input.talentId,
        stage: input.stage ?? "prospect",
        source: input.source ?? "sourcing",
      },
      { onConflict: "company_id,talent_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTalentRelationshipStage(id: string, stage: TalentRelStage) {
  const { error } = await supabase.from("talent_relationships").update({ stage }).eq("id", id);
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// Agent pitch log (outbound engagement)
// -----------------------------------------------------------------------------

export async function listAgentPitchLog(talentId: string, limit: number) {
  const { data, error } = await supabase
    .from("agent_pitch_log")
    .select("id, company_id, message, phone, dispatched, created_at, companies(name, logo_url)")
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as any[];
}

// -----------------------------------------------------------------------------
// Identity documents (KYC)
// -----------------------------------------------------------------------------

export interface IdentityDocRecord {
  id: string;
  doc_type: "nid" | "passport";
  front_url: string;
  back_url: string | null;
  status: "pending" | "verified" | "rejected";
  review_notes: string | null;
  created_at: string;
}

export async function getLatestIdentityDoc(talentId: string): Promise<IdentityDocRecord | null> {
  const { data, error } = await supabase
    .from("talent_id_documents" as any)
    .select("*")
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return ((data as any[]) ?? [])[0] ?? null;
}

export async function insertIdentityDoc(input: {
  talentId: string;
  userId: string;
  docType: "nid" | "passport";
  frontUrl: string;
  backUrl: string | null;
}) {
  const { error } = await supabase.from("talent_id_documents" as any).insert({
    talent_id: input.talentId,
    user_id: input.userId,
    doc_type: input.docType,
    front_url: input.frontUrl,
    back_url: input.backUrl,
    status: "pending",
  } as any);
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// Payout accounts
// -----------------------------------------------------------------------------

export async function listPayoutAccounts(talentId: string) {
  const { data, error } = await supabase
    .from("talent_payout_accounts" as any)
    .select("*")
    .eq("talent_id", talentId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data as any[]) ?? []) as any[];
}

export async function insertPayoutAccount(input: {
  talentId: string;
  userId: string;
  method: "bkash" | "bank" | "paypal" | "wise";
  accountName: string;
  accountNumber: string;
  bankName: string | null;
  isPrimary: boolean;
}) {
  const { error } = await supabase.from("talent_payout_accounts" as any).insert({
    talent_id: input.talentId,
    user_id: input.userId,
    method: input.method,
    account_name: input.accountName,
    account_number: input.accountNumber,
    bank_name: input.bankName,
    is_primary: input.isPrimary,
  } as any);
  if (error) throw error;
}

export async function setPayoutAccountPrimary(accountId: string) {
  const { error } = await supabase
    .from("talent_payout_accounts" as any)
    .update({ is_primary: true } as any)
    .eq("id", accountId);
  if (error) throw error;
}

export async function deletePayoutAccount(accountId: string) {
  const { error } = await supabase.from("talent_payout_accounts" as any).delete().eq("id", accountId);
  if (error) throw error;
}

// ─── Phase 10j.2 — RBAC lookups ───────────────────────────────────────────
export async function listUserRoles(userId: string): Promise<Array<{ role: string }>> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as Array<{ role: string }>;
}

export async function listUserRolesSafe(userId: string): Promise<Array<{ role: string }>> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []) as Array<{ role: string }>;
}

// -----------------------------------------------------------------------------
// Phase 10j.3b additions — onboarding & RBAC lookups
// -----------------------------------------------------------------------------

import { supabase as _supabaseProfile } from "@/integrations/supabase/client";

export async function isUserAdmin(userId: string): Promise<boolean> {
  const { data, error } = await _supabaseProfile
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function listActiveCountries() {
  const { data, error } = await _supabaseProfile
    .from("gtm_countries")
    .select("id, iso2, name")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; iso2: string; name: string }>;
}

export async function listActiveCareerStages() {
  const { data, error } = await _supabaseProfile
    .from("career_stages")
    .select("id, name, slug, academy_id")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string; slug: string; academy_id: string | null }>;
}

export async function listActiveProfessionCategoriesFull() {
  const { data, error } = await _supabaseProfile
    .from("profession_categories")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string }>;
}

export async function listProfessionalRolesByCategory(categoryId: string) {
  const { data, error } = await _supabaseProfile
    .from("professional_roles")
    .select("id, name, profession_category_id")
    .eq("profession_category_id", categoryId)
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string; profession_category_id: string }>;
}

export async function searchOnboardingInstitutions(opts: { query: string; countryName?: string | null }) {
  const base = () =>
    _supabaseProfile
      .from("institutions")
      .select("id, name, country")
      .eq("type", "university")
      .order("name")
      .limit(30);
  let q = base();
  if (opts.query) q = q.ilike("name", `%${opts.query}%`);
  if (opts.countryName) q = q.ilike("country", opts.countryName);
  const { data, error } = await q;
  if (error) throw error;
  if ((data ?? []).length === 0 && opts.countryName) {
    let global = base();
    if (opts.query) global = global.ilike("name", `%${opts.query}%`);
    const { data: globalData, error: gErr } = await global;
    if (gErr) throw gErr;
    return (globalData ?? []) as Array<{ id: string; name: string; country: string | null }>;
  }
  return (data ?? []) as Array<{ id: string; name: string; country: string | null }>;
}

export async function listActiveSchools(academyId?: string | null) {
  let q = _supabaseProfile
    .from("schools")
    .select("id, name, slug, description, icon, academy_id")
    .eq("is_active", true)
    .order("display_order");
  if (academyId) q = q.eq("academy_id", academyId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string; slug: string; description: string | null; icon: string | null; academy_id: string | null }>;
}

// ─── Phase 10j.5h6: public discovery & profile RPC wrappers ───────────────
export async function getPublicTalentProfile<T = any>(handle: string): Promise<T | null> {
  const { data, error } = await supabase.rpc("get_public_talent_profile", { _handle: handle });
  if (error) throw error;
  return (data ?? null) as T | null;
}

export async function searchPublicTalents<T = any>(args: {
  filters: { keyword?: string; country?: string; skills?: string[] | null };
  limit: number;
  offset: number;
}): Promise<T> {
  const { data, error } = await supabase.rpc("search_public_talents", {
    p_filters: args.filters as any,
    p_limit: args.limit,
    p_offset: args.offset,
  });
  if (error) throw error;
  return (data ?? {}) as T;
}

export async function getTalentOutcomeSignal<T = any>(talentId: string): Promise<T> {
  const { data, error } = await supabase.rpc("get_talent_outcome_signal", { _talent_id: talentId });
  if (error) throw error;
  return (data ?? {}) as T;
}

// ─── Phase 10j.5h9 ────────────────────────────────────────────────────────
export async function checkCvDuplicate<T = any>(args: { fingerprint: string; selfUserId: string }): Promise<T> {
  const { data, error } = await supabase.rpc("check_cv_duplicate", {
    _fingerprint: args.fingerprint,
    _self_user_id: args.selfUserId,
  });
  if (error) throw error;
  return data as T;
}

export async function provisionOrGetInstance(args: { clusterGeoId: string; funnel: Record<string, unknown> }) {
  const { data, error } = await supabase.rpc(
    "provision_or_get_instance" as never,
    { _cluster_geo_id: args.clusterGeoId, _funnel: args.funnel } as never,
  );
  return { data, error } as { data: any; error: any };
}

// -----------------------------------------------------------------------------
// Storage helpers (Phase 10j.5i)
// Buckets owned by profile domain: portfolio-uploads (public), talent-id-docs (private)
// -----------------------------------------------------------------------------

export async function uploadPortfolioFile(
  path: string,
  file: File,
  options?: { upsert?: boolean; contentType?: string },
): Promise<{ path: string; publicUrl: string }> {
  const { error } = await supabase.storage
    .from("portfolio-uploads")
    .upload(path, file, { upsert: options?.upsert ?? false, contentType: options?.contentType });
  if (error) throw error;
  const { data } = supabase.storage.from("portfolio-uploads").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export function getPortfolioPublicUrl(path: string): string {
  return supabase.storage.from("portfolio-uploads").getPublicUrl(path).data.publicUrl;
}

export async function uploadToBucketPublic(
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean; contentType?: string },
): Promise<{ path: string; publicUrl: string }> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: options?.upsert ?? false, contentType: options?.contentType });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export function getBucketPublicUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function uploadIdentityDoc(
  path: string,
  file: File,
  options?: { upsert?: boolean; contentType?: string },
): Promise<{ path: string }> {
  const { error } = await supabase.storage
    .from("talent-id-docs")
    .upload(path, file, { upsert: options?.upsert ?? false, contentType: options?.contentType });
  if (error) throw error;
  return { path };
}

export async function createIdentityDocSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from("talent-id-docs")
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeFromBucket(bucket: string, paths: string[]): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw error;
}
