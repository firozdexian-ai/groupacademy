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
