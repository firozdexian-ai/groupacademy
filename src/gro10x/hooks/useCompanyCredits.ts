/**
 * Returns the current Gro10x company's credit balance + a 90-day ledger.
 * Reads `company_credits` and `company_credit_transactions` via the
 * companies repo under the new member-read RLS policies.
 */
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  getActiveCompanyIdForUser,
  getCompanyCreditPools,
  listCompanyCreditTransactionsSince,
  type CompanyCreditTxnRow,
} from "@/domains/companies/repo/companiesRepo";

export type CompanyCreditTxn = CompanyCreditTxnRow;

export function useCompanyCredits() {
  const { user } = useAuth();

  const companyQuery = useQuery({
    queryKey: ["gro10x-company-id", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => getActiveCompanyIdForUser(user!.id),
  });

  const companyId = companyQuery.data ?? null;

  const balanceQuery = useQuery({
    queryKey: ["company-credits", companyId],
    enabled: !!companyId,
    staleTime: 30 * 1000,
    queryFn: async () => getCompanyCreditPools(companyId!),
  });

  const ledgerQuery = useQuery({
    queryKey: ["company-credit-ledger", companyId],
    enabled: !!companyId,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<CompanyCreditTxn[]> => {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      return listCompanyCreditTransactionsSince(companyId!, since, 200);
    },
  });

  // Live balance updates via realtime subscription on the company's row
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`company-credits-${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "company_credits", filter: `company_id=eq.${companyId}` },
        () => balanceQuery.refetch(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "company_credit_transactions",
          filter: `company_id=eq.${companyId}`,
        },
        () => ledgerQuery.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  return {
    companyId,
    balance: balanceQuery.data?.balance ?? 0,
    earnedBalance: balanceQuery.data?.earnedBalance ?? 0,
    ledger: ledgerQuery.data ?? [],
    isLoading: companyQuery.isLoading || balanceQuery.isLoading,
  };
}
