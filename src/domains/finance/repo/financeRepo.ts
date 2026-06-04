/**
 * GroUp Academy: Finance Domain Core Repository Data Store Layer
 * Authoritative system datastore layer tracking fractional balances, transaction histories, and gateway rules.
 */
import { supabase } from "@/integrations/supabase/client";

export interface TalentWallet {
  id: string;
  balance: number;
  earned_balance: number;
  talent: { full_name: string; email: string };
}
export interface CompanyWallet {
  id: string;
  balance: number;
  earned_balance: number;
  company: { name: string; type: string };
}
export interface CreditInvoice {
  id: string;
  invoice_number: string;
  bundle_credits: number;
  currency: string;
  bundle_price_usd: number;
  bundle_price_local: number;
  status: string;
  payment_method: string;
  created_at: string;
  talent_id: string;
  talent: { full_name: string };
}
export interface WithdrawalRequest {
  id: string;
  talent_id: string;
  amount_credits: number;
  method: string;
  status: string;
  payout_details: string;
  created_at: string;
  talent: { full_name: string; email: string };
}
export interface PayInfraConfig {
  id: string;
  provider: string;
  status: string;
  created_at: string;
}

/**
 * Fetches the master ledger graph overview metrics payload across all platform segments.
 */
export async function getFinOpsGraphMaster() {
  const [talentWalletsRes, companyWalletsRes, invoicesRes, withdrawalsRes, payInfraRes] = await Promise.all([
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

  if (talentWalletsRes.error) {
    console.error("[Accounting Graph] Candidate balances read error:", talentWalletsRes.error);
    throw talentWalletsRes.error;
  }
  if (companyWalletsRes.error) {
    console.error("[Accounting Graph] Corporate accounts read error:", companyWalletsRes.error);
    throw companyWalletsRes.error;
  }
  if (invoicesRes.error) {
    console.error("[Accounting Graph] Invoices ledger read error:", invoicesRes.error);
    throw invoicesRes.error;
  }
  if (withdrawalsRes.error) {
    console.error("[Accounting Graph] Payout requests read error:", withdrawalsRes.error);
    throw withdrawalsRes.error;
  }
  if (payInfraRes.error) {
    console.error("[Accounting Graph] Payment gateways configurations read error:", payInfraRes.error);
    throw payInfraRes.error;
  }

  return {
    talentWallets: talentWalletsRes.data ?? [],
    companyWallets: companyWalletsRes.data ?? [],
    invoices: invoicesRes.data ?? [],
    withdrawals: withdrawalsRes.data ?? [],
    payInfraConfigs: payInfraRes.data ?? [],
  };
}

/**
 * Updates a specific disbursement request row's status state inside the ledger.
 */
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

  if (error) {
    console.error(`[Accounting Ledger] Failed to update withdrawal request row ${input.id}:`, error);
    throw error;
  }
}

/**
 * Programmatically provisions or updates property parameters for transactional billing networks.
 */
export async function upsertPaymentConfig(payload: any): Promise<void> {
  if (payload?.id) {
    const { error } = await supabase.from("fin_payment_configs").update(payload).eq("id", payload.id);
    if (error) {
      console.error(`[Accounting Ledger] Failed to update payment config route ${payload.id}:`, error);
      throw error;
    }
  } else {
    const { error } = await supabase.from("fin_payment_configs").insert(payload as any);
    if (error) {
      console.error("[Accounting Ledger] Failed to insert new payment configuration parameter:", error);
      throw error;
    }
  }
}

/**
 * Queries total fractional tokens circulating across all B2C student accounts.
 */
export async function getTalentCreditsTotalCirculation(): Promise<number> {
  const { data, error } = await supabase.from("talent_credits").select("balance");
  if (error) {
    console.error("[Accounting Ledger] Error calculating circulating credits volume summary:", error);
    throw error;
  }
  return ((data as any[]) ?? []).reduce((sum, c) => sum + Number(c.balance ?? 0), 0);
}

export interface ListTalentCreditsOpts {
  page: number;
  pageSize: number;
}

/**
 * Builds paginated candidate query streams coupled with user authentication metadata values.
 */
export function buildListTalentCreditsQuery(opts: ListTalentCreditsOpts) {
  const from = (opts.page - 1) * opts.pageSize;
  return supabase
    .from("talent_credits")
    .select(`*, talent:talents(full_name, email)`, { count: "exact" })
    .order("balance", { ascending: false })
    .range(from, from + opts.pageSize - 1);
}

/**
 * Builds paginated transactional history lists filtered by balance modification types.
 */
export function buildListCreditTransactionsQuery(opts: { page: number; pageSize: number; typeFilter?: string }) {
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

/**
 * Fetches lifetime operational expenditures logs across platform features.
 */
export async function getConsumptionTotals(): Promise<Array<{ amount: number; service_type: string | null }>> {
  const { data, error } = await supabase.from("credit_transactions").select("amount, service_type").lt("amount", 0);
  if (error) {
    console.error("[Accounting Analytics] Error reading historical debit totals records:", error);
    throw error;
  }
  return (data ?? []) as any;
}

/**
 * Gathers target billing period usage metrics variables to trace current burn cycles.
 */
export async function getMonthlyConsumption(startIso: string, endIso: string): Promise<Array<{ amount: number }>> {
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("amount")
    .lt("amount", 0)
    .gte("created_at", startIso)
    .lte("created_at", endIso);
  if (error) {
    console.error("[Accounting Analytics] Error loading target timeline consumption windows:", error);
    throw error;
  }
  return (data ?? []) as any;
}

/**
 * Defensive Fallback Script: Adjusts balances and appends log fields directly when central Postgres RPC loops are blocked.
 */
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
  if (updateError) {
    console.error(`[Workforce Safeguard] Manual balance override error on row ${input.creditId}:`, updateError);
    throw updateError;
  }
  const { error: txError } = await (supabase.from("credit_transactions") as any).insert({
    talent_id: input.talentId,
    amount: input.delta,
    transaction_type: input.transactionType,
    description: input.description,
    balance_after: input.newBalance,
  });
  if (txError) {
    console.error("[Workforce Safeguard] Manual ledger transaction log generation failure:", txError);
    throw txError;
  }
}

/**
 * Sums credit yields earned from course resell referral loops.
 */
export async function sumReferralBonusCredits(talentId: string): Promise<number> {
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("amount")
    .eq("talent_id", talentId)
    .eq("service_type", "referral_bonus");
  if (error) {
    console.error(`[Accounting Analytics] Referral metrics read failure for user ${talentId}:`, error);
    throw error;
  }
  return (data ?? []).reduce((sum: number, row: any) => sum + Number(row?.amount ?? 0), 0);
}

/**
 * Streams foreign exchange valuation tables from backend settings registries.
 */
export async function listActiveCurrencyRates() {
  const { data, error } = await supabase
    .from("currency_rates")
    .select("code, symbol, name, usd_rate, country_codes")
    .order("code");
  if (error) {
    console.error("[Accounting Configurations] Currency rates tax lookup failure:", error);
    throw error;
  }
  return (data ?? []) as any[];
}

/**
 * Submits custom alternative transaction logs when localized manuals require validation checks.
 */
export async function insertManualPaymentRequest(payload: Record<string, any>): Promise<void> {
  const { error } = await supabase.from("manual_payment_requests").insert(payload as any);
  if (error) {
    console.error("[Accounting Ledger] Error uploading manual payment request item:", error);
    throw error;
  }
}

/**
 * Feds payout disbursement profiles matching a target candidate reference ID.
 */
export async function listMyTalentPayoutAccounts(talentId: string) {
  const { data, error } = await supabase.from("talent_payout_accounts").select("*").eq("talent_id", talentId);
  if (error) {
    console.error(`[Accounting Ledger] Error loading payout account records for user ${talentId}:`, error);
    throw error;
  }
  return (data as any[]) ?? [];
}

/**
 * Fetches complete un-paginated withdrawal items matching a single user account context.
 */
export async function listMyWithdrawalRequests(talentId: string) {
  const { data, error } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error(`[Accounting Ledger] Error loading user historical cash withdrawals for user ${talentId}:`, error);
    throw error;
  }
  return (data as any[]) ?? [];
}

/**
 * Enqueues a candidate withdrawal transaction item down to the administrative audit pipeline queue.
 */
export async function insertTalentWithdrawalRequest(payload: {
  talent_id: string;
  amount_credits: number;
  method: string;
  payout_details: Record<string, unknown>;
}): Promise<{ error: any }> {
  const { error } = await supabase.from("withdrawal_requests").insert(payload as any);
  if (error) {
    console.error(`[Accounting Ledger] Failed to transmit cash withdrawal line for user ${payload.talent_id}:`, error);
  }
  return { error };
}

export interface DeductCreditsArgs {
  amount: number;
  serviceType: string;
  referenceId?: string | null;
  description?: string;
  talentId?: string;
  transactionType?: string;
}

/**
 * Secure Server Database RPC Wrapper: Executes an immutable atomic deduction check directly inside PostgreSQL.
 */
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
  if (error) {
    console.error("[Database RPC] Transaction execution error inside deduct_credits script:", error);
    throw error;
  }
  return data as any;
}

export interface AddCreditsArgs {
  amount: number;
  transactionType: string;
  description?: string;
  talentId?: string;
}

/**
 * Secure Server Database RPC Wrapper: Executes an atomic balance addition check natively on back-end tables.
 */
export async function addCreditsRpc(args: AddCreditsArgs) {
  const payload: Record<string, any> = {
    p_amount: args.amount,
    p_transaction_type: args.transactionType,
    p_description: args.description ?? `${args.transactionType} update`,
  };
  if (args.talentId) payload.p_talent_id = args.talentId;
  const { data, error } = await supabase.rpc("add_credits" as any, payload as any);
  if (error) {
    console.error("[Database RPC] Transaction execution error inside add_credits script:", error);
    throw error;
  }
  return data as any;
}

export interface ApproveInvoiceArgs {
  invoiceId: string;
  paymentMethod: string;
  paymentReference?: string | null;
  paymentProofUrl: string;
  adminNotes?: string | null;
}

/**
 * Secure Server Database RPC Wrapper: Fulfills a custom invoice and triggers system balance adjustments.
 */
export async function approveInvoiceAndDisburse(args: ApproveInvoiceArgs) {
  const { data, error } = await supabase.rpc("approve_invoice_and_disburse", {
    p_invoice_id: args.invoiceId,
    p_payment_method: args.paymentMethod,
    p_payment_reference: args.paymentReference ?? null,
    p_payment_proof_url: args.paymentProofUrl,
    p_admin_notes: args.adminNotes ?? null,
  });
  if (error) {
    console.error("[Database RPC] Transaction execution error inside approve_invoice_and_disburse script:", error);
    throw error;
  }
  return data as { success: boolean; error?: string; credits_added?: number };
}

/**
 * Secure Server Database RPC Wrapper: Voids an unpaid invoice statement reference.
 */
export async function cancelInvoice(args: { invoiceId: string; reason?: string | null }): Promise<void> {
  const { error } = await supabase.rpc("cancel_invoice", {
    p_invoice_id: args.invoiceId,
    p_reason: args.reason ?? null,
  });
  if (error) {
    console.error("[Database RPC] Transaction execution error inside cancel_invoice script:", error);
    throw error;
  }
}

/**
 * Secure Server Database RPC Wrapper: Auto-generates an invoice reference line during credit checkout sequences.
 */
export async function createCreditInvoice(args: { credits: number; priceUsd: number }) {
  const { data, error } = await supabase.rpc("create_credit_invoice", {
    p_bundle_credits: args.credits,
    p_bundle_price_usd: args.priceUsd,
  });
  if (error) {
    console.error("[Database RPC] Transaction execution error inside create_credit_invoice script:", error);
    throw error;
  }
  return data as { success: boolean; invoice_number?: string };
}

/**
 * Storage Asset Layer: Transmits binary deposit confirmations up to our private system bucket.
 */
export async function uploadPaymentProof(
  path: string,
  file: File,
  options?: { upsert?: boolean; contentType?: string },
): Promise<{ path: string }> {
  const { error } = await supabase.storage
    .from("payment-proofs")
    .upload(path, file, { upsert: options?.upsert ?? false, contentType: options?.contentType });
  if (error) {
    console.error(`[Storage Bucket] File transport failed for receipt path ${path}:`, error);
    throw error;
  }
  return { path };
}

/**
 * Storage Asset Layer: Feds a time-gated secure signed link to access receipt files without exposing public object URLs.
 */
export async function createPaymentProofSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, expiresInSeconds);
  if (error) {
    console.error(`[Storage Bucket] Signed URL token generation failure for path ${path}:`, error);
    throw error;
  }
  return data.signedUrl;
}

/**
 * Folds key core gateway parameter settings records from primary tables.
 */
export async function getPaymentConfigSettings(): Promise<Array<{ key: string; value: string }>> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["payment_gateway", "stripe_publishable_key", "stripe_mode", "currency", "whatsapp_purchase_enabled"]);
  if (error) {
    console.error("[Platform Settings] Error loading global checkout property values maps:", error);
    throw error;
  }
  return (data ?? []) as Array<{ key: string; value: string }>;
}

/**
 * Telemetry Pipeline: Enqueues monetization intent signals into the central system events registry.
 */
export async function logMonetizationIntent(userId: string, surface: string): Promise<void> {
  const { error } = await supabase.from("platform_events").insert({
    event_kind: "monetization_intent_detected",
    subject_kind: "user",
    subject_id: userId,
    payload: { surface, timestamp: new Date().toISOString() },
  });
  if (error) {
    console.error(`[Telemetry Broker] Failed to enqueue monetization metrics point for user ${userId}:`, error);
  }
}

/**
 * Streams exact fractional credit balance properties matching a target candidate record.
 */
export async function getTalentCreditBalance(talentId: string) {
  const { data, error } = await supabase
    .from("talent_credits")
    .select("balance, earned_balance")
    .eq("talent_id", talentId)
    .maybeSingle();
  if (error) {
    console.error(`[Accounting Ledger] Quota readout failure matching candidate reference ID ${talentId}:`, error);
    throw error;
  }
  return (data ?? { balance: 0, earned_balance: 0 }) as { balance: number; earned_balance: number };
}

/**
 * Fetches recent transaction items matching a targeted candidate profile context.
 */
export async function listTalentCreditTransactions(talentId: string, limit = 20) {
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error(`[Accounting Ledger] Error loading account transaction rows for user ${talentId}:`, error);
    throw error;
  }
  return (data ?? []) as any[];
}

/**
 * Queries invoice statements generated matching a single user account reference.
 */
export async function listMyCreditInvoices(talentId: string, limit = 50) {
  const { data, error } = await supabase
    .from("credit_invoices")
    .select("*")
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error(`[Accounting Ledger] Error loading historical client invoices for user ${talentId}:`, error);
    throw error;
  }
  return (data ?? []) as any[];
}

/**
 * Aggregates complete candidate career tools engagement vectors maps across assessments, interviews, and salary analyses.
 */
export async function getTalentServiceHistorySnapshot(talentId: string) {
  const [assessmentsRes, interviewsRes, salaryAnalysesRes] = await Promise.all([
    supabase
      .from("career_assessments")
      .select("id, created_at, percentage, readiness_level")
      .eq("talent_id", talentId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("mock_interviews")
      .select("id, created_at, status, selection_percentage, job_title")
      .eq("talent_id", talentId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("salary_analyses")
      .select("id, created_at, status, job_title")
      .eq("talent_id", talentId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);
  return {
    assessments: (assessmentsRes.data ?? []) as any[],
    interviews: (interviewsRes.data ?? []) as any[],
    salaryAnalyses: (salaryAnalysesRes.data ?? []) as any[],
  };
}

/**
 * Returns the comprehensive admin list queue capturing all platform cash withdrawal records.
 */
export async function listAdminWithdrawalRequests() {
  const { data, error } = await supabase
    .from("withdrawal_requests")
    .select("*, talent:talents(full_name, email)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[Accounting Ledger] Error loading system-wide withdrawal records list queue:", error);
    throw error;
  }
  return (data ?? []) as any[];
}

/**
 * Modifies an individual system-wide payment config key-value record parameter row natively inside platform settings.
 */
export async function updatePlatformSettingByKey(key: string, value: string | null): Promise<void> {
  const { error } = await supabase
    .from("platform_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key);
  if (error) {
    console.error(`[Platform Settings] Error writing update value string for property key ${key}:`, error);
    throw error;
  }
}

/**
 * Pulls a high-budget list snapshot of credit invoices filtered by target status.
 */
export async function listAdminCreditInvoices(status?: string | null, limit = 500) {
  let q = supabase
    .from("credit_invoices")
    .select("*, talents:talent_id (full_name, email, phone)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) {
    console.error("[Accounting Ledger] Error loading comprehensive admin credit invoices list:", error);
    throw error;
  }
  return (data ?? []) as any[];
}
