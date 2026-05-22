/**
 * Finance domain repository (Phase 10i.1).
 */
import { supabase } from "@/integrations/supabase/client";

export async function getFinOpsGraphMaster() {
  const [
    talentWalletsRes,
    companyWalletsRes,
    invoicesRes,
    withdrawalsRes,
    payInfraRes,
  ] = await Promise.all([
    supabase
      .from("talent_credits")
      .select("id, balance, earned_balance, talent_id, talent:talents(full_name, email)")
      .order("balance", { ascending: false })
      .limit(200),
    supabase
      .from("company_credits")
      .select("id, balance, earned_balance, company_id, company:companies(name, type)")
      .order("balance", { ascending: false })
      .limit(200),
    supabase
      .from("credit_invoices")
      .select(
        "id, invoice_number, bundle_credits, currency, bundle_price_usd, bundle_price_local, status, payment_method, created_at, talent_id, talent:talents(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("withdrawal_requests")
      .select(
        "id, talent_id, amount_credits, method, status, payout_details, created_at, talent:talents(full_name, email)",
      )
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("fin_payment_configs")
      .select("id, provider, status, created_at")
      .order("created_at", { ascending: false }),
  ]);
  if (talentWalletsRes.error) throw talentWalletsRes.error;
  if (companyWalletsRes.error) throw companyWalletsRes.error;
  if (invoicesRes.error) throw invoicesRes.error;
  if (withdrawalsRes.error) throw withdrawalsRes.error;
  if (payInfraRes.error) throw payInfraRes.error;
  return {
    talentWallets: talentWalletsRes.data ?? [],
    companyWallets: companyWalletsRes.data ?? [],
    invoices: invoicesRes.data ?? [],
    withdrawals: withdrawalsRes.data ?? [],
    payInfraConfigs: payInfraRes.data ?? [],
  };
}

export async function updateWithdrawalStatus(input: {
  id: string;
  status: "completed" | "rejected" | "failed";
}): Promise<void> {
  const { error } = await supabase
    .from("withdrawal_requests")
    .update({
      status: input.status,
      processed_at: new Date().toISOString(),
    })
    .eq("id", input.id);
  if (error) throw error;
}

export async function upsertPaymentConfig(payload: any): Promise<void> {
  if (payload?.id) {
    const { error } = await supabase
      .from("fin_payment_configs")
      .update(payload)
      .eq("id", payload.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("fin_payment_configs").insert(payload as any);
    if (error) throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TalentCreditsTab
// ─────────────────────────────────────────────────────────────────────────────

export async function getTalentCreditsTotalCirculation(): Promise<number> {
  const { data } = await supabase.from("talent_credits").select("balance");
  return ((data as any[]) ?? []).reduce((sum, c) => sum + Number(c.balance ?? 0), 0);
}

export interface ListTalentCreditsOpts {
  page: number;
  pageSize: number;
}

export function buildListTalentCreditsQuery(opts: ListTalentCreditsOpts) {
  const from = (opts.page - 1) * opts.pageSize;
  return supabase
    .from("talent_credits")
    .select(`*, talent:talents(full_name, email)`, { count: "exact" })
    .order("balance", { ascending: false })
    .range(from, from + opts.pageSize - 1);
}

export function buildListCreditTransactionsQuery(opts: {
  page: number;
  pageSize: number;
  typeFilter?: string;
}) {
  const from = (opts.page - 1) * opts.pageSize;
  let q = supabase
    .from("credit_transactions")
    .select(`*, talent:talents(full_name, email)`, { count: "exact" })
    .order("created_at", { ascending: false });
  if (opts.typeFilter && opts.typeFilter !== "all") {
    q = q.eq("transaction_type", opts.typeFilter);
  }
  return q.range(from, from + opts.pageSize - 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Consumption telemetry
// ─────────────────────────────────────────────────────────────────────────────

export async function getConsumptionTotals(): Promise<Array<{ amount: number; service_type: string | null }>> {
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("amount, service_type")
    .lt("amount", 0);
  if (error) throw error;
  return (data ?? []) as any;
}

export async function getMonthlyConsumption(startIso: string, endIso: string): Promise<Array<{ amount: number }>> {
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("amount")
    .lt("amount", 0)
    .gte("created_at", startIso)
    .lte("created_at", endIso);
  if (error) throw error;
  return (data ?? []) as any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual ledger fallback (when add_credits / deduct_credits RPCs unavailable)
// ─────────────────────────────────────────────────────────────────────────────

export async function manualAdjustTalentCredit(input: {
  creditId: string;
  talentId: string;
  newBalance: number;
  delta: number;
  transactionType: "admin_credit" | "admin_debit";
  description: string;
}): Promise<void> {
  const { error: updateError } = await supabase
    .from("talent_credits")
    .update({ balance: input.newBalance, updated_at: new Date().toISOString() })
    .eq("id", input.creditId);
  if (updateError) throw updateError;
  const { error: txError } = await (supabase.from("credit_transactions") as any).insert({
    talent_id: input.talentId,
    amount: input.delta,
    transaction_type: input.transactionType,
    description: input.description,
    balance_after: input.newBalance,
  });
  if (txError) throw txError;
}

/* ---------------- Phase 10j.3: referral telemetry ---------------- */

export async function sumReferralBonusCredits(talentId: string): Promise<number> {
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("amount")
    .eq("talent_id", talentId)
    .eq("service_type", "referral_bonus");
  if (error) throw error;
  return (data ?? []).reduce((sum: number, row: any) => sum + Number(row?.amount ?? 0), 0);
}

// -----------------------------------------------------------------------------
// Phase 10j.3b additions
// -----------------------------------------------------------------------------

export async function listActiveCurrencyRates() {
  const { data, error } = await supabase
    .from("currency_rates")
    .select("code, symbol, name, usd_rate, country_codes")
    .order("code");
  if (error) throw error;
  return (data ?? []) as any[];
}

// ─── Phase 10j.4: manual payment requests ──────────────────────────────────
export async function insertManualPaymentRequest(payload: Record<string, any>): Promise<void> {
  const { error } = await supabase.from("manual_payment_requests").insert(payload as any);
  if (error) throw error;
}

// ─── Phase 10j.5e: talent-side withdrawal helpers ──────────────────────────
export async function listMyTalentPayoutAccounts(talentId: string) {
  const { data, error } = await supabase
    .from("talent_payout_accounts")
    .select("*")
    .eq("talent_id", talentId);
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function listMyWithdrawalRequests(talentId: string) {
  const { data, error } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function insertTalentWithdrawalRequest(payload: {
  talent_id: string;
  amount_credits: number;
  method: string;
  payout_details: Record<string, unknown>;
}): Promise<{ error: any }> {
  const { error } = await supabase.from("withdrawal_requests").insert(payload as any);
  return { error };
}

// ─── Phase 10j.5h2: credit RPC wrappers ───────────────────────────────────
export interface DeductCreditsArgs {
  amount: number;
  serviceType: string;
  referenceId?: string | null;
  description?: string;
  talentId?: string;
  transactionType?: string;
}

export async function deductCreditsRpc(args: DeductCreditsArgs) {
  const payload: Record<string, any> = {
    p_amount: args.amount,
    p_service_type: args.serviceType,
    p_reference_id: args.referenceId ?? null,
    p_description: args.description ?? `Service: ${args.serviceType}`,
  };
  if (args.talentId) payload.p_talent_id = args.talentId;
  if (args.transactionType) payload.p_transaction_type = args.transactionType;
  const { data, error } = await supabase.rpc("deduct_credits" as any, payload as any);
  if (error) throw error;
  return data as any;
}

export interface AddCreditsArgs {
  amount: number;
  transactionType: string;
  description?: string;
  talentId?: string;
}

export async function addCreditsRpc(args: AddCreditsArgs) {
  const payload: Record<string, any> = {
    p_amount: args.amount,
    p_transaction_type: args.transactionType,
    p_description: args.description ?? `${args.transactionType} sync`,
  };
  if (args.talentId) payload.p_talent_id = args.talentId;
  const { data, error } = await supabase.rpc("add_credits" as any, payload as any);
  if (error) throw error;
  return data as any;
}

// ─── Phase 10j.5h9 ────────────────────────────────────────────────────────
export interface ApproveInvoiceArgs {
  invoiceId: string;
  paymentMethod: string;
  paymentReference?: string | null;
  paymentProofUrl: string;
  adminNotes?: string | null;
}

export async function approveInvoiceAndDisburse(args: ApproveInvoiceArgs) {
  const { data, error } = await supabase.rpc("approve_invoice_and_disburse", {
    p_invoice_id: args.invoiceId,
    p_payment_method: args.paymentMethod,
    p_payment_reference: args.paymentReference ?? null,
    p_payment_proof_url: args.paymentProofUrl,
    p_admin_notes: args.adminNotes ?? null,
  });
  if (error) throw error;
  return data as { success: boolean; error?: string; credits_added?: number };
}

export async function cancelInvoice(args: { invoiceId: string; reason?: string | null }): Promise<void> {
  const { error } = await supabase.rpc("cancel_invoice", {
    p_invoice_id: args.invoiceId,
    p_reason: args.reason ?? null,
  });
  if (error) throw error;
}

export async function createCreditInvoice(args: { credits: number; priceUsd: number }) {
  const { data, error } = await supabase.rpc("create_credit_invoice", {
    p_bundle_credits: args.credits,
    p_bundle_price_usd: args.priceUsd,
  });
  if (error) throw error;
  return data as { success: boolean; invoice_number?: string };
}
