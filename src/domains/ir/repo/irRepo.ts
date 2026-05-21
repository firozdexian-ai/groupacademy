/**
 * IR domain repository (Phase 10i.3).
 *
 * Wraps raw supabase.from(...) calls for the IR admin area:
 * - Unified dashboard telemetry
 * - VC firms, investors, influencers, interactions, targets
 * - Outreach + email communications log
 * - Data room documents, share links, telemetry
 */
import { supabase } from "@/integrations/supabase/client";

// ─── Generic helpers ───────────────────────────────────────────────────────
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

// ─── Dashboard telemetry ───────────────────────────────────────────────────
export async function getIRDashboardTelemetry(currentMonth: string, startOfMonthIso: string) {
  const last30d = new Date(Date.now() - 30 * 86400000).toISOString();
  const [targetRes, usageRes, vcRes, invRes, talentRes, outreachRes] = await Promise.all([
    supabase.from("ir_monthly_targets").select("*").eq("month", currentMonth).maybeSingle(),
    supabase
      .from("credit_transactions")
      .select("amount, service_type, talent_id")
      .in("transaction_type", ["service_usage", "usage"])
      .gte("created_at", startOfMonthIso),
    supabase.from("ir_vc_firms").select("id", { count: "exact", head: true }),
    supabase.from("ir_investors").select("id", { count: "exact", head: true }),
    supabase.from("talents").select("id", { count: "exact", head: true }),
    supabase.from("ir_outreach_log").select("id", { count: "exact", head: true }).gt("created_at", last30d),
  ]);

  const totalCredits = usageRes.data?.reduce((sum, t: any) => sum + Math.abs(t.amount), 0) || 0;
  const byService: Record<string, number> = {};
  usageRes.data?.forEach((t: any) => {
    if (t.service_type) byService[t.service_type] = (byService[t.service_type] || 0) + Math.abs(t.amount);
  });

  return {
    target: (targetRes.data as any) || null,
    usage: {
      totalCredits,
      byService,
      activeTalents: new Set(usageRes.data?.map((d: any) => d.talent_id).filter(Boolean)).size,
    },
    registry: {
      vcs: vcRes.count || 0,
      investors: invRes.count || 0,
      talents: talentRes.count || 0,
      outreach30: outreachRes.count || 0,
    },
  };
}

// ─── VC firms ──────────────────────────────────────────────────────────────
export async function listVCFirms(): Promise<any[]> {
  const { data, error } = await supabase
    .from("ir_vc_firms")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listVCFirmsMin(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase.from("ir_vc_firms").select("id, name").order("name");
  if (error) throw error;
  return (data ?? []) as any;
}

// ─── Investors ─────────────────────────────────────────────────────────────
export async function upsertInvestor(payload: any): Promise<void> {
  return upsertGraphRow("ir_investors", payload);
}
export async function deleteInvestor(id: string): Promise<void> {
  return deleteGraphRow("ir_investors", id);
}

// ─── Investor interactions ─────────────────────────────────────────────────
export async function logInvestorInteraction(input: {
  investorId: string;
  payload: Record<string, any>;
  updatePayload: Record<string, any>;
}): Promise<void> {
  const { error: insertError } = await supabase
    .from("ir_investor_interactions")
    .insert({ investor_id: input.investorId, ...input.payload });
  if (insertError) throw insertError;
  const { error: updateError } = await supabase
    .from("ir_investors")
    .update(input.updatePayload)
    .eq("id", input.investorId);
  if (updateError) throw updateError;
}

// ─── Monthly targets ───────────────────────────────────────────────────────
export async function upsertMonthlyTarget(payload: any & { id?: string }): Promise<void> {
  return upsertGraphRow("ir_monthly_targets", payload);
}

// ─── Outreach + email communications ───────────────────────────────────────
export async function logOutreachAndEmail(input: {
  outreach: Record<string, any>;
  email: Record<string, any>;
}): Promise<void> {
  const { error: logError } = await supabase.from("ir_outreach_log").insert([input.outreach]);
  if (logError) throw logError;
  const { error: commError } = await supabase.from("ir_email_communications").insert([input.email]);
  if (commError) throw commError;
}

// ─── Influencers ───────────────────────────────────────────────────────────
export async function listInfluencers(tier?: string): Promise<any[]> {
  let query = supabase
    .from("ir_influencers")
    .select("*")
    .order("created_at", { ascending: false });
  if (tier && tier !== "all") query = query.eq("tier", tier);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function upsertInfluencer(payload: any): Promise<void> {
  return upsertGraphRow("ir_influencers", payload);
}
export async function deleteInfluencer(id: string): Promise<void> {
  return deleteGraphRow("ir_influencers", id);
}

// ─── Data room ─────────────────────────────────────────────────────────────
export async function listDataRoomDocuments(): Promise<any[]> {
  const { data, error } = await supabase
    .from("ir_data_room_documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function uploadDataRoomDocument(input: {
  file: File;
  title: string;
  doc_type: string;
  total_slides?: number | null;
}): Promise<void> {
  const path = `${crypto.randomUUID()}/${input.file.name}`;
  const { error: upErr } = await supabase.storage.from("ir-data-room").upload(path, input.file, { upsert: false });
  if (upErr) throw upErr;
  const { data: user } = await supabase.auth.getUser();
  const { error } = await supabase.from("ir_data_room_documents").insert({
    title: input.title,
    doc_type: input.doc_type,
    file_url: path,
    total_slides: input.total_slides ?? null,
    created_by: user.user?.id,
  });
  if (error) throw error;
}

export async function createDataRoomShareLink(input: {
  document_id: string;
  investor_id?: string | null;
  expires_in_days?: number | null;
  require_email?: boolean;
}): Promise<any> {
  const { data: user } = await supabase.auth.getUser();
  const expires_at =
    input.expires_in_days && input.expires_in_days > 0
      ? new Date(Date.now() + input.expires_in_days * 86400000).toISOString()
      : null;
  const { data, error } = await supabase
    .from("ir_data_room_share_links")
    .insert({
      document_id: input.document_id,
      investor_id: input.investor_id ?? null,
      expires_at,
      require_email: input.require_email ?? true,
      created_by: user.user?.id,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function revokeDataRoomShareLink(id: string): Promise<void> {
  const { error } = await supabase
    .from("ir_data_room_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function listShareLinksByDocument(documentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("ir_data_room_share_links")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listDocumentViews(documentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("ir_document_views")
    .select("*")
    .eq("document_id", documentId)
    .order("started_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function listDocumentHotSlides(documentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("ir_document_hot_slides" as any)
    .select("*")
    .eq("document_id", documentId)
    .order("total_dwell", { ascending: false });
  if (error) throw error;
  return ((data as unknown) ?? []) as any[];
}
