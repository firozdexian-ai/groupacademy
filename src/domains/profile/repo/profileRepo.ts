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
