import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getFinOpsGraphMaster,
  updateWithdrawalStatus as repoUpdateWithdrawalStatus,
  upsertPaymentConfig,
} from "@/domains/finance/repo/financeRepo";

// --- Global Type Defs ---
export interface TalentWallet { id: string; balance: number; earned_balance: number; talent: { full_name: string; email: string }; }
export interface CompanyWallet { id: string; balance: number; earned_balance: number; company: { name: string; type: string }; }
export interface CreditInvoice { id: string; invoice_number: string; bundle_credits: number; currency: string; bundle_price_usd: number; bundle_price_local: number; status: string; payment_method: string; created_at: string; talent_id: string; talent: { full_name: string }; }
export interface WithdrawalRequest { id: string; talent_id: string; amount_credits: number; method: string; status: string; payout_details: string; created_at: string; talent: { full_name: string; email: string }; }
export interface PayInfraConfig { id: string; provider: string; status: string; created_at: string; }

export function useFinOpsGraph() {
  const queryClient = useQueryClient();

  const finOpsGraphQuery = useQuery({
    queryKey: ["finops_graph_master"],
    queryFn: async () => {
      const master = await getFinOpsGraphMaster();

      const talentWallets = (master.talentWallets as any[]).map((w) => ({
        ...w, talent: w.talent || { full_name: "Unknown", email: "" },
      }));
      const companyWallets = (master.companyWallets as any[]).map((w) => ({
        ...w, company: w.company || { name: "Unknown", type: "Unknown" },
      }));
      const creditInvoices = (master.invoices as any[]).map((i) => ({
        ...i, talent: i.talent || { full_name: "Unknown" },
      }));
      const withdrawalRequests = (master.withdrawals as any[]).map((wr) => ({
        ...wr, talent: wr.talent || { full_name: "Unknown", email: "" },
      }));

      const gro10xWallets = companyWallets.filter((w: any) => w.company.type === "agent" || w.company.name.toLowerCase().includes("gro10x"));
      const standardCompanyWallets = companyWallets.filter((w: any) => w.company.type !== "agent" && !w.company.name.toLowerCase().includes("gro10x"));

      return {
        talentWallets: talentWallets as TalentWallet[],
        companyWallets: standardCompanyWallets as CompanyWallet[],
        gro10xWallets: gro10xWallets as CompanyWallet[],
        invoices: creditInvoices as CreditInvoice[],
        withdrawals: withdrawalRequests as WithdrawalRequest[],
        payInfraConfigs: (master.payInfraConfigs ?? []) as PayInfraConfig[],
      };
    },
  });

  const updateWithdrawalStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "completed" | "rejected" | "failed"; notes?: string }) => {
      await repoUpdateWithdrawalStatus({ id, status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["finops_graph_master"] });
      toast.success(`Withdrawal ${variables.status} successfully.`);
    },
    onError: (e: Error) => toast.error(`Status update failed: ${e.message}`),
  });

  const upsertPayInfra = useMutation({
    mutationFn: async (payload: any) => {
      await upsertPaymentConfig(payload);
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
      upsertPayInfra,
    },
  };
}
