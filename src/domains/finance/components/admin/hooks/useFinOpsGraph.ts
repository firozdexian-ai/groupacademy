import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// --- Global Type Defs ---
export interface TalentWallet { id: string; balance: number; earned_balance: number; talent: { full_name: string; email: string }; }
export interface CompanyWallet { id: string; balance: number; earned_balance: number; company: { name: string; type: string }; }
export interface CreditInvoice { id: string; invoice_number: string; bundle_credits: number; currency: string; bundle_price_usd: number; bundle_price_local: number; status: string; payment_method: string; created_at: string; talent_id: string; talent: { full_name: string }; }
export interface WithdrawalRequest { id: string; talent_id: string; amount_credits: number; method: string; status: string; payout_details: string; created_at: string; talent: { full_name: string; email: string }; }
export interface PayInfraConfig { id: string; provider: string; status: string; created_at: string; }

export function useFinOpsGraph() {
  const queryClient = useQueryClient();

  // 1. The Master Ledger Query
  const finOpsGraphQuery = useQuery({
    queryKey: ["finops_graph_master"],
    queryFn: async () => {
      const [
        talentWalletsRes,
        companyWalletsRes,
        invoicesRes,
        withdrawalsRes,
        payInfraRes
      ] = await Promise.all([
        supabase.from("talent_credits").select("id, balance, earned_balance, talent_id, talent:talents(full_name, email)").order("balance", { ascending: false }).limit(200),
        supabase.from("company_credits").select("id, balance, earned_balance, company_id, company:companies(name, type)").order("balance", { ascending: false }).limit(200),
        supabase.from("credit_invoices").select("id, invoice_number, bundle_credits, currency, bundle_price_usd, bundle_price_local, status, payment_method, created_at, talent_id, talent:talents(full_name)").order("created_at", { ascending: false }).limit(300),
        supabase.from("withdrawal_requests").select("id, talent_id, amount_credits, method, status, payout_details, created_at, talent:talents(full_name, email)").order("created_at", { ascending: false }).limit(300),
        supabase.from("fin_payment_configs").select("id, provider, status, created_at").order("created_at", { ascending: false }),
      ]);

      // Throw first encountered error
      if (talentWalletsRes.error) throw talentWalletsRes.error;
      if (companyWalletsRes.error) throw companyWalletsRes.error;
      if (invoicesRes.error) throw invoicesRes.error;
      if (withdrawalsRes.error) throw withdrawalsRes.error;
      if (payInfraRes.error) throw payInfraRes.error;

      // Map relation fields safely
      const talentWallets = (talentWalletsRes.data || []).map((w: any) => ({
        ...w, talent: w.talent || { full_name: "Unknown", email: "" }
      }));

      const companyWallets = (companyWalletsRes.data || []).map((w: any) => ({
        ...w, company: w.company || { name: "Unknown", type: "Unknown" }
      }));

      const creditInvoices = (invoicesRes.data || []).map((i: any) => ({
        ...i, talent: i.talent || { full_name: "Unknown" }
      }));

      const withdrawalRequests = (withdrawalsRes.data || []).map((wr: any) => ({
        ...wr, talent: wr.talent || { full_name: "Unknown", email: "" }
      }));

      // Gro10x vs standard companies logic separation
      const gro10xWallets = companyWallets.filter((w: any) => w.company.type === "agent" || w.company.name.toLowerCase().includes("gro10x"));
      const standardCompanyWallets = companyWallets.filter((w: any) => w.company.type !== "agent" && !w.company.name.toLowerCase().includes("gro10x"));

      return {
        talentWallets: talentWallets as TalentWallet[],
        companyWallets: standardCompanyWallets as CompanyWallet[],
        gro10xWallets: gro10xWallets as CompanyWallet[],
        invoices: creditInvoices as CreditInvoice[],
        withdrawals: withdrawalRequests as WithdrawalRequest[],
        payInfraConfigs: (payInfraRes.data || []) as PayInfraConfig[],
      };
    },
  });

  // 2. Withdrawal Mutation (Approve / Reject)
  const updateWithdrawalStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "completed" | "rejected" | "failed"; notes?: string }) => {
      const { error } = await supabase.from("withdrawal_requests").update({
        status,
        processed_at: new Date().toISOString(),
        // Admin notes would go here if schema supports it, omitted for safety
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["finops_graph_master"] });
      toast.success(`Withdrawal ${variables.status} successfully.`);
    },
    onError: (e: Error) => toast.error(`Status update failed: ${e.message}`),
  });

  // 3. Generic Upsert for Pay Infra
  const upsertPayInfra = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        const { error } = await supabase.from("fin_payment_configs").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fin_payment_configs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finops_graph_master"] });
      toast.success(`Payment infrastructure updated.`);
    },
    onError: (e: Error) => toast.error(`Update Failed: ${e.message}`),
  });

  return {
    finOpsGraphQuery,
    mutations: {
      updateWithdrawalStatus,
      upsertPayInfra
    }
  };
}
